
const socketIO = require("socket.io");
const { Op } = require("sequelize");
// const fs = require('fs');
const models = require('./models');
const enums = require('../src/enum');
const { asyncLogin } = require('./handler');
const { makeToken, getDateByToekn } = require('./websocketctl/authorization');

const memo_ctl = {websocket: null, userMap: {}, mapIdMap: {}, cityMap: {}, countryMap: {}};
// const clientArraies = {};



function onDisconnect(socket) {
    socket.on('disconnect', (msg) => {
        var userinfo = socket.request.session.userinfo;
        if (!userinfo) { return; }
        console.log('disconnected: ', userinfo ? userinfo.nickname : 'unknown');
    });
}


function onMessage(socket) {

    socket.on(enums.MESSAGE, (msg) => {
        const act = msg.act || '';
        const payload = msg.payload || {};
        const userinfo = socket.request.session.userinfo;
        let switched = subSwitchOnMessage(act, payload, userinfo);
        return switched && switched.catch(err => console.log(err));
    });

    return true;


    function subSwitchOnMessage(act, payload, userinfo) {
        
        switch (act) {
            case enums.ACT_GET_GLOBAL_USERS_INFO: {
                const ugAttributes = enums.UserGlobalAttributes;
                let users = Object.values(memo_ctl.userMap).map(user => {
                    let _ = [];
                    ugAttributes.map(col => { _.push(user[col]); });
                    return _;
                });
                return subEmit(act, {users});
            }
            
            default:
                console.log("Not Found Act: ", act);
        }
        return null;
    }

    function subEmit(act, payload) {
        emitSocketByte(socket, enums.MESSAGE, {act, payload});
    }
}


function emitSocketByte(socket, frame, data) {
    var buf = Buffer.from(JSON.stringify(data), 'utf-8');
    socket.emit(frame, buf);
    return socket;
}


function flatMap(obj, col) {
    return Object.values(obj).map(e => {
        let _ = [];
        col.map(c => { _.push(e[c]) });
        return _;
    });
}


function emitGlobalGneralArraies(socket) {
    let users = flatMap(memo_ctl.userMap, enums.UserGlobalAttributes);
    let maps = flatMap(memo_ctl.mapIdMap, enums.MapsGlobalAttributes);
    let cities = flatMap(memo_ctl.cityMap, enums.CityGlobalAttributes);
    let countries = flatMap(memo_ctl.countryMap, enums.CountryGlobalAttributes);
    return emitSocketByte(socket, enums.MESSAGE, {act: enums.ACT_GET_GLOBAL_DATA, payload: {users, maps, cities, countries}});
}


function refreshBasicData(callback) {
    const promises = [];
    const promise1 = models.User.findAll({attributes: {exclude: ['pwd', 'createdAt']}}).then((users) => {
        users.map(user => {
            let _user = user.toJSON();
            _user = parseJson(_user, ['mapPathIds', 'destoryByCountryIds']);
            memo_ctl.userMap[user.id] = _user;
        });
    });
    const promise2 = models.Map.findAll({attributes: {exclude: ['adventureId', 'createdAt', 'updatedAt']}}).then(maps => {
        maps.map(m => {
            let _m = m.toJSON();
            memo_ctl.mapIdMap[_m.id] = _m;
        });
    });
    const promise3 = models.City.findAll({attributes: {exclude: ['createdAt', 'updatedAt']}}).then(cities => {
        cities.map(city => {
            let _city = city.toJSON();
            _city = parseJson(_city, ['jsonConstruction']);
            memo_ctl.cityMap[_city.id] = _city;
        });
    });
    const promise4 = models.Country.findAll({attributes: {exclude: ['createdAt', 'updatedAt']}}).then(countries => {
        countries.map(country => {
            let _country = country.toJSON();
            memo_ctl.countryMap[_country.id] = _country;
        });
    });
    promises.push(promise1, promise2, promise3, promise4);
    var _all = Promise.all(promises);
    if (callback) {
        _all.then(callback);
    }
    return _all;
}


function parseJson(obj, keys = []) {
    keys.forEach(key => {
        let _loc = obj[key];
        if (typeof _loc == 'string') {
            obj[key] = _loc.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(_loc) : JSON.parse(_loc);
        }
    });
    return obj;
}



function broadcast(obj) {
    return memo_ctl.websocket.emit('MESSAGE', obj);
}









module.exports = {
    buildWsConnection: function(http_serv, middleware) {
        const io = socketIO(http_serv, {cors: {origin: '*'}});
        const onConn = this.onConnect;
        memo_ctl.websocket = io;
        memo_ctl.websocket.use(function(socket, next) {
            middleware(socket.request, socket.request.res || {}, next);
        });
        refreshBasicData().then(() => {
            memo_ctl.websocket.on('connection', onConn);
        });
    },
    onConnect: function(socket) {
        const request = socket.request;
        const session = request.session;
        const userInfo = session.userinfo || {};
        const loginTimestamp = userInfo.loginTimestamp;
        const address = socket.handshake.address;
        var authorized = false;
        var binded = false;
        const loadGun = (userId) => {
            let fullUserInfo = memo_ctl.userMap[userId];
            authorized = true;
            if (binded == false) {
                binded = true;
                session.userinfo = {
                    ...fullUserInfo,
                    loginTimestamp,
                };
                onMessage(socket);
                emitGlobalGneralArraies(socket);
                console.log(`A user [${fullUserInfo.nickname}] loaded socket connection.`);
            }
            return fullUserInfo;
        }
        
        console.log(`A user [${userInfo.nickname}] has socket connected. address [${address}]`);

        socket.on(enums.AUTHORIZE, (msg) => {
            let reason = '';
            switch (typeof msg) {
                case 'string': {
                    if (!msg.match(/^\d+$/)) {
                        break;
                    }
                }
                case 'number': {
                    if (parseInt(msg) == loginTimestamp) {
                        return emitSocketByte(socket, enums.AUTHORIZE, {act: enums.AUTHORIZE, payload: loadGun(userInfo.id)});
                    }
                    reason = 'loginstamp wrong.';
                }
                case 'object': {
                    console.log('[AUTHORIZE] msg: ', msg);
                    try {
                        if (msg.token) {
                            let userdata = getDateByToekn(msg.token);
                            if (userdata && userdata.id && userdata.address == address) {
                                return emitSocketByte(socket, enums.AUTHORIZE, {act: enums.AUTHORIZE, payload: loadGun(userdata.id)});
                            }
                            reason = 'token wrong.';
                        } else if (msg.code) {
                            return asyncLogin(msg.code, msg.pwd).then(e => {
                                if (e.done) {
                                    let fullUserInfo = loadGun(e.data.id);
                                    let token = makeToken(fullUserInfo.id, fullUserInfo.code, e.data.loginTimestamp, address);
                                    console.log('makeToken token: ', token)
                                    return emitSocketByte(socket, enums.AUTHORIZE, {act: enums.AUTHORIZE, payload: fullUserInfo, token});
                                } else {
                                    register = !!e.register;
                                    reason = register ? 'Not setting yet.' : e.msg;
                                    return emitSocketByte(socket, enums.AUTHORIZE, {act: enums.FAILED, reason, register});
                                }
                            });
                        }
                    } catch (err) {
                        console.log(err);
                    }
                }
                default:
                    return emitSocketByte(socket, enums.AUTHORIZE, {act: enums.FAILED, reason, redirect: authorized ? 'logout' : ''});
            }
        });

        onDisconnect(socket);
    }
}
