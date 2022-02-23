
const socketIO = require("socket.io");
const { Op } = require("sequelize");
// const fs = require('fs');
const models = require('./models');
const enums = require('../src/enum');
const { asyncLogin } = require('./handler');
const { makeToken, getDateByToekn } = require('./websocketctl/authorization');

const ROOM_CHATTING_BAR = 'roomchattingbar';
const memo_ctl = {websocket: null, userMap: {}, maps: [], mapIdMap: {}, cityMap: {}, countryMap: {}};
// const clientArraies = {};






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
        const ugAttributes = enums.UserGlobalAttributes;
        switch (act) {
            case enums.ACT_GET_GLOBAL_USERS_INFO: {
                let users = Object.values(memo_ctl.userMap).map(user => {
                    let _ = [];
                    ugAttributes.map(col => { _.push(user[col]); });
                    return _;
                });
                return subEmit(act, {users});
            }
            case enums.ACT_GET_GLOBAL_DATA: {
                const mapAttributes = enums.MapsGlobalAttributes;
                const cityAttributes = enums.CityGlobalAttributes;
                const countryAttributes = enums.CountryGlobalAttributes;
                let users = flatMap(memo_ctl.userMap, ugAttributes);
                let maps = memo_ctl.maps.map(m => {
                    let _ = [];
                    mapAttributes.map(col => { _.push(m[col]) });
                    return _;
                });
                let cities = flatMap(memo_ctl.cityMap, cityAttributes);
                let countries = flatMap(memo_ctl.countryMap, countryAttributes);
                return subEmit(act, {users, maps, cities, countries});
            }
            
            default:
                console.log("Not Found Act: ", act);
        }
        return null;
    }

    function subEmit(act, payload) {
        emitSocketByte(socket, enums.MESSAGE, {act, payload});
    }

    function flatMap(obj, col) {
        return Object.values(obj).map(e => {
            let _ = [];
            col.map(c => { _.push(e[c]) });
            return _;
        });
    }
}





function onDisconnect(socket) {
    socket.on('disconnect', (msg) => {
        var userinfo = socket.request.session.userinfo;
        if (!userinfo) { return; }
        console.log('disconnected: ', userinfo ? userinfo.nickname : 'unknown');
    });
}





function broadcastChatRoom(obj) {
    return memo_ctl.websocket.to(ROOM_CHATTING_BAR).emit('MESSAGE', obj);
}

function broadcast(obj) {
    return memo_ctl.websocket.emit('MESSAGE', obj);
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
        memo_ctl.maps = maps.map(m => {
            let _m = m.toJSON();
            memo_ctl.mapIdMap[_m.id] = _m;
            return _m;
        });
    });
    const promise3 = models.City.findAll({attributes: {exclude: ['createdAt', 'updatedAt']}}).then(cities => {
        cities.map(city => {
            let _city = city.toJSON();
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



function emitSocketByte(socket, frame, data) {
    var buf = Buffer.from(JSON.stringify(data), 'utf-8');
    socket.emit(frame, buf);
    return socket;
}


module.exports = {
    buildWsConnection: function(http_serv, middleware) {
        const io = socketIO(http_serv, {cors: {origin: '*'}});
        const onConn = this.onConnect;
        memo_ctl.websocket = io;
        refreshBasicData().then(() => {
            memo_ctl.websocket.on('connection', onConn);
            memo_ctl.websocket.use(function(socket, next) {
                middleware(socket.request, socket.request.res || {}, next);
            });
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
                console.log(`A user [${fullUserInfo.nickname}] loaded socket connection.`);
            }
            return fullUserInfo;
        }
        
        console.log(`A user [${userInfo.nickname}] has socket connected. address [${address}]`);

        socket.on(enums.AUTHORIZE, (msg) => {
            let reason = '';
            switch (typeof msg) {
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
                            let userdata = getDateByToekn[msg.token];
                            if (userdata && userdata.id && userdata.address == address) {
                                return emitSocketByte(socket, enums.AUTHORIZE, {act: enums.AUTHORIZE, payload: loadGun(userdata.id)});
                            }
                            reason = 'token wrong.';
                        } else if (msg.code) {
                            return asyncLogin(msg.code, msg.pwd).then(e => {
                                if (e.done) {
                                    let fullUserInfo = loadGun(e.data.id);
                                    let token = makeToken(fullUserInfo.id, fullUserInfo.code, e.data.loginTimestamp, address);
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
