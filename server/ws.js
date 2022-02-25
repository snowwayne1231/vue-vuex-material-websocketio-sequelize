
const socketIO = require("socket.io");
const { Op } = require("sequelize");
// const fs = require('fs');
const models = require('./models');
const enums = require('../src/enum');
const algorithms = require('./websocketctl/algorithm');
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
                return subEmitMessage(act, {users});
            }
            case enums.ACT_MOVE: {
                const targetId = payload;
                const nowId = userinfo.mapNowId;
                const dis = algorithms.getMapDistance(nowId, targetId);
                if (dis <= userinfo.actPoint) {
                    return updateUserInfo(userinfo, {mapNowId: targetId, actPoint: userinfo.actPoint - dis}, socket);
                } else {
                    return subEmitMessage(enums.ALERT, {msg: 'Not enough act point.', act});
                }
            }
            case enums.ACT_LEAVE_COUNTRY: {
                if (userinfo.actPoint > 0 && userinfo.role == 2 && (userinfo.loyalUserId == 0 || userinfo.destoryByCountryIds.length > 0)) {
                    return updateUserInfo(userinfo, { countryId: 0, role: enums.ROLE_FREEMAN, actPoint: 0, money: 0, soldier: 0 }, socket)
                } else {
                    return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
                }
            }
            case enums.ACT_ENTER_COUNTRY: {
                const mapId = userinfo.mapNowId;
                const thisMap = memo_ctl.mapIdMap[mapId];
                if (thisMap && userinfo.actPoint > 0) {
                    const thisCountryId = thisMap.ownCountryId;
                    const dbci = userinfo.destoryByCountryIds;
                    console.log('thisCountryId : ', thisCountryId)
                    console.log('dbci : ', dbci)
                    if (thisCountryId && thisCountryId > 0 && memo_ctl.countryMap[thisCountryId] && dbci.includes && !dbci.includes(thisCountryId)) {
                        const ratio = Math.round(Math.random() * 10) / 10;
                        return updateUserInfo(userinfo, { countryId: ratio >= 0.5 ? thisCountryId: 0, role: enums.ROLE_GENERMAN, actPoint: 0 }, socket)
                    }
                }
                return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
            }
            case enums.ACT_SEARCH_WILD: {
                const mapId = userinfo.mapNowId;
                const thisMap = memo_ctl.mapIdMap[mapId];
                if (userinfo.actPoint > 0 && thisMap && thisMap.type === enums.TYPE_WILD) {
                    const randomMoney = Math.round(Math.random() * 100) + 50;
                    return updateUserInfo(userinfo, { money: userinfo.money + randomMoney, actPoint: userinfo.actPoint-1,  }, socket);
                }
                return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
            }
            case enums.ACT_INCREASE_SOLDIER: {
                const mapId = userinfo.mapNowId;
                const thisMap = memo_ctl.mapIdMap[mapId];
                if (userinfo.actPoint > 0 && thisMap && thisMap.type === enums.TYPE_CITY) {
                    const randomSoldier = Math.round(Math.random() * 200) + 100;
                    return updateUserInfo(userinfo, { soldier: userinfo.soldier + randomSoldier, actPoint: userinfo.actPoint-1,  }, socket);
                }
                return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
            }
            
            default:
                console.log("Not Found Act: ", act);
        }
        return null;
    }

    function subEmitMessage(act, payload) {
        emitSocketByte(socket, enums.MESSAGE, {act, payload});
    }
}


function emitSocketByte(socket, frame, data) {
    var buf = Buffer.from(JSON.stringify(data), 'utf-8');
    socket.emit(frame, buf);
    return socket;
}


function broadcastSocketByte(frame, data) {
    var buf = Buffer.from(JSON.stringify(data), 'utf-8');
    return memo_ctl.websocket.emit(frame, buf);
}


function flatMap(obj, col) {
    return Object.values(obj).map(e => {
        let _ = [];
        col.map(c => { _.push(e[c]) });
        return _;
    });
}


function emitGlobalGneralArraies(socket) {
    const users = flatMap(memo_ctl.userMap, enums.UserGlobalAttributes);
    const maps = flatMap(memo_ctl.mapIdMap, enums.MapsGlobalAttributes);
    const cities = flatMap(memo_ctl.cityMap, enums.CityGlobalAttributes);
    const countries = flatMap(memo_ctl.countryMap, enums.CountryGlobalAttributes);
    return emitSocketByte(socket, enums.MESSAGE, {act: enums.ACT_GET_GLOBAL_DATA, payload: {users, maps, cities, countries}});
}


function emitGlobalChanges(changes = []) {
    return broadcastSocketByte(enums.MESSAGE, {act: enums.ACT_GET_GLOBAL_CHANGE_DATA, payload: changes});
}


function refreshByAdmin() {
    refreshBasicData().then(() => {
        const users = flatMap(memo_ctl.userMap, enums.UserGlobalAttributes);
        const maps = flatMap(memo_ctl.mapIdMap, enums.MapsGlobalAttributes);
        const cities = flatMap(memo_ctl.cityMap, enums.CityGlobalAttributes);
        const countries = flatMap(memo_ctl.countryMap, enums.CountryGlobalAttributes);
        broadcastSocketByte(enums.MESSAGE, {act: enums.ACT_GET_GLOBAL_DATA, payload: { users, maps, cities, countries }});
    });
}


function refreshBasicData(callback) {
    const promises = [];
    const promise1 = models.User.findAll({attributes: {exclude: ['pwd', 'createdAt']}}).then((users) => {
        users.map(user => {
            let _user = user.toJSON();
            _user = parseJson(_user, ['mapPathIds', 'destoryByCountryIds']);
            memo_ctl.userMap[user.id] = _user;
        });
        return true
    });
    const promise2 = models.Map.findAll({attributes: {exclude: ['adventureId', 'createdAt', 'updatedAt']}}).then(maps => {
        const _maps = maps.map(m => {
            let _m = m.toJSON();
            _m.type = _m.cityId > 0 ? enums.TYPE_CITY : enums.TYPE_WILD;
            memo_ctl.mapIdMap[_m.id] = _m;
            return _m;
        });
        algorithms.setMapData(_maps);
        return true
    });
    const promise3 = models.City.findAll({attributes: {exclude: ['createdAt', 'updatedAt']}}).then(cities => {
        cities.map(city => {
            let _city = city.toJSON();
            _city = parseJson(_city, ['jsonConstruction']);
            memo_ctl.cityMap[_city.id] = _city;
        });
        return true
    });
    const promise4 = models.Country.findAll({attributes: {exclude: ['createdAt', 'updatedAt']}}).then(countries => {
        countries.map(country => {
            let _country = country.toJSON();
            memo_ctl.countryMap[_country.id] = _country;
        });
        return true
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


async function updateUserInfo(userinfo, update, socket=null) {
    const id = userinfo.id;
    const updatedKeys = Object.keys(update);
    const userGlobalAttrs = enums.UserGlobalAttributes;
    await models.User.update(update, {where: { id }});
    updatedKeys.map(key => {
        const val = update[key];
        userinfo[key] = val;
        if (memo_ctl.userMap[id] && memo_ctl.userMap[id][key]) {
            memo_ctl.userMap[id][key] = val;
        }
    });
    if (socket) {
        emitSocketByte(socket, enums.AUTHORIZE, {act: enums.AUTHORIZE, payload: update});
    }
    if (updatedKeys.some(key => { return userGlobalAttrs.includes(key) })) {
        emitGlobalChanges({
            dataset: [
                { depth: ['users', userinfo.id], update },
            ],
        });
    }
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
                        if (msg === 'refreshByAdmin') {
                            return refreshByAdmin()
                        }
                        break
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
                        /*
                            for locally test...
                        */
                        if (address == '::ffff:127.0.0.1') {
                            return emitSocketByte(socket, enums.AUTHORIZE, {act: enums.AUTHORIZE, payload: loadGun(2)});
                        }
                    } catch (err) {
                        console.log(err);
                    }
                }
                default:
                    return emitSocketByte(socket, enums.AUTHORIZE, {act: enums.FAILED, reason, redirect: authorized ? '/logout' : '/'});
            }
        });

        onDisconnect(socket);
    }
}
