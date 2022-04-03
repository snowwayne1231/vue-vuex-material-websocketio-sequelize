
const socketIO = require("socket.io");
const { Op } = require("sequelize");
// const fs = require('fs');
const models = require('./models');
const enums = require('../src/enum');
const algorithms = require('./websocketctl/algorithm');
const events = require('./events');
const battles = require('./battles');
const { asyncLogin } = require('./handler');
const { makeToken, getDateByToekn } = require('./websocketctl/authorization');
const onMessage = require('./wsMessage');



const memo_ctl = {
    websocket: null,
    userSockets: [],
    userMap: {},
    mapIdMap: {},
    cityMap: {},
    countryMap: {},
    battlefieldMap: {},
    warRecords: [],
    occupationMap: {},
    gameMap: {},
    eventCtl: events,
    battleCtl: battles,
    broadcast: broadcastSocketByte,
    emitSocketByte,
};
const globalConfigs = { round: { value: -1, staticKey: '' }, season: { value: -1, staticKey: '' } };



function onDisconnect(socket) {
    socket.on('disconnect', (msg) => {
        var userinfo = socket.request.session.userinfo;
        if (!userinfo) { return; }
        console.log('disconnected: ', userinfo ? userinfo.nickname : 'unknown');
        var userIdx = memo_ctl.userSockets.findIndex(e => e.id == userinfo.id);
        if (userIdx >= 0) {
            memo_ctl.userSockets.splice(userIdx, 1);
        }
    });
}



function emitSocketByte(socket, frame, data) {
    var buf = Buffer.from(JSON.stringify(data), 'utf-8');
    socket.emit(frame, buf);
    return socket;
}


function broadcastSocketByte(frame, data, countryId = 0) {
    var buf = Buffer.from(JSON.stringify(data), 'utf-8');
    return (countryId==0) ? 
        memo_ctl.websocket.emit(frame, buf) :
        memo_ctl.userSockets.map(us => {
            return us.userinfo.countryId == countryId && us.socket.emit(frame, buf);
        });
}


function emitGlobalGneralArraies(socket, userinfo) {
    const actMaxIdx = enums.UserGlobalAttributes.indexOf('actPointMax');
    const users = algorithms.flatMap(memo_ctl.userMap, enums.UserGlobalAttributes).filter(u => u[actMaxIdx] > 0);
    const maps = algorithms.flatMap(memo_ctl.mapIdMap, enums.MapsGlobalAttributes);
    const cities = algorithms.flatMap(memo_ctl.cityMap, enums.CityGlobalAttributes);
    const countries = algorithms.flatMap(memo_ctl.countryMap, enums.CountryGlobalAttributes);
    const battlefieldMap = memo_ctl.battlefieldMap;
    const gameMap = memo_ctl.gameMap;
    const occupationMap = memo_ctl.occupationMap;
    const notifications = memo_ctl.eventCtl.getRecords();
    const domesticMessages = memo_ctl.eventCtl.getRecords(userinfo.countryId);
    const warRecords = algorithms.flatMap(memo_ctl.warRecords, enums.WarRecordGlobalAttributes);
    return emitSocketByte(socket, enums.MESSAGE, {act: enums.ACT_GET_GLOBAL_DATA, payload: {users, maps, cities, countries, notifications, battlefieldMap, occupationMap, gameMap, domesticMessages, warRecords}});
}


function emitGlobalChanges(changes = []) {
    return broadcastSocketByte(enums.MESSAGE, {act: enums.ACT_GET_GLOBAL_CHANGE_DATA, payload: changes});
}


function refreshByAdmin() {
    refreshBasicData().then(() => {
        const actMaxIdx = enums.UserGlobalAttributes.indexOf('actPointMax');
        const users = algorithms.flatMap(memo_ctl.userMap, enums.UserGlobalAttributes).filter(u => u[actMaxIdx] > 0);
        const maps = algorithms.flatMap(memo_ctl.mapIdMap, enums.MapsGlobalAttributes);
        const cities = algorithms.flatMap(memo_ctl.cityMap, enums.CityGlobalAttributes);
        const countries = algorithms.flatMap(memo_ctl.countryMap, enums.CountryGlobalAttributes);
        const battlefieldMap = memo_ctl.battlefieldMap;
        const occupationMap = memo_ctl.occupationMap;
        const warRecords = algorithms.flatMap(memo_ctl.warRecords, enums.WarRecordGlobalAttributes);
        broadcastSocketByte(enums.MESSAGE, { act: enums.ACT_GET_GLOBAL_DATA, payload: { users, maps, cities, countries, battlefieldMap, occupationMap, warRecords } });
        memo_ctl.userSockets.map(e => {
            const memoUser = memo_ctl.userMap[e.id];
            if (e.userinfo) {
                memoUser && Object.keys(e.userinfo).map(key => {
                    if (memoUser.hasOwnProperty(key)) {
                        e.userinfo[key] = memoUser[key];
                    }
                });
            }
            if (e.socket) {
                emitSocketByte(e.socket, enums.AUTHORIZE, {act: enums.AUTHORIZE, payload: memoUser});
            }
        });
    });
}


function refreshMemoDataUsers() {
    return refreshBasicData(true, false, false).then(() => {
        return memo_ctl.userSockets.map(us => {
            const memoUser = memo_ctl.userMap[us.id];
            if (us.userinfo) {
                memoUser && Object.keys(us.userinfo).map(key => {
                    if (memoUser[key]) { us.userinfo[key] = memoUser[key]; }
                });
            }
            if (us.socket) {
                emitSocketByte(us.socket, enums.AUTHORIZE, {act: enums.AUTHORIZE, payload: memoUser});
            }
        });
    });
}


function refreshBasicData(u=true, m=true, c=true, callback=null) {
    const promises = [];
    if (u) {
        const promise1 = models.User.findAll({attributes: {exclude: ['pwd', 'createdAt']}}).then((users) => {
            users.map(user => {
                let _user = user.toJSON();
                _user = algorithms.parseJson(_user, ['destoryByCountryIds']);
                memo_ctl.userMap[user.id] = _user;
            });
            return true
        });
        promises.push(promise1);
    }
    
    if (m) {
        const promise2 = models.Map.findAll({attributes: {exclude: ['adventureId', 'createdAt', 'updatedAt']}}).then(maps => {
            const _maps = maps.map(m => {
                let _m = m.toJSON();
                _m.type = _m.cityId > 0 ? enums.TYPE_CITY : enums.TYPE_WILD;
                _m.route = typeof _m.route == 'string' ? _m.route.split(',').map(_ => parseInt(_)) : _m.route;
                memo_ctl.mapIdMap[_m.id] = _m;
                return _m;
            });
            algorithms.setMapData(_maps);
            return true
        });
        const promise3 = models.City.findAll({attributes: {exclude: ['createdAt', 'updatedAt']}}).then(cities => {
            cities.map(city => {
                let _city = city.toJSON();
                _city = algorithms.parseJson(_city, ['jsonConstruction']);
                memo_ctl.cityMap[_city.id] = _city;
            });
            return true
        });
        promises.push(promise2, promise3);
        const promise6 = models.RecordWar.findAll({ attributes: {exclude: ['createdAt', 'updatedAt']}, where: { winnerCountryId: 0 } }).then(wars => {
            const newfieldMap = {};
            wars.map(e => {
                const _loc = e.toJSON();
                newfieldMap[_loc.mapId] = _loc;
            });
            memo_ctl.battlefieldMap = newfieldMap;
            return true
        });
        promises.push(promise6);
        const promise8 = models.RecordWar.findAll({ attributes: ['id', 'timestamp', 'mapId', 'winnerCountryId', 'attackCountryIds', 'defenceCountryId'], where: { winnerCountryId: {[Op.gt]: 0} } }).then(wars => {
            const nextary = wars.map(e => {
                return e.toJSON();
            });
            memo_ctl.warRecords = nextary;
            return true
        });
        promises.push(promise8);
        const promise9 = models.Game.findAll({ attributes: {exclude: ['createdAt', 'updatedAt']} }).then(games => {
            games.map(game => {
                memo_ctl.gameMap[game.id] = game.toJSON();
            });
            return true
        });
        promises.push(promise9);
    }

    if (c) {
        const promise4 = models.Country.findAll({attributes: {exclude: ['createdAt', 'updatedAt']}}).then(countries => {
            countries.map(country => {
                let _country = country.toJSON();
                memo_ctl.countryMap[_country.id] = _country;
            });
            return true
        });
        promises.push(promise4);
        const promise7 = models.Occupation.findAll({attributes: {exclude: ['isAllowedPk', 'isAllowedItem', 'addPeopleLimit', 'createdAt', 'updatedAt']}}).then(os => {
            os.map(o => {
                memo_ctl.occupationMap[o.id] = o.toJSON();
            });
        });
        promises.push(promise7);
    }
    
    var _all = Promise.all(promises);
    if (callback) {
        _all.then(callback);
    }
    return _all;
}



async function updateUserInfo(userinfo, update, act, socket=null) {
    const id = userinfo.id;
    const updatedKeys = Object.keys(update);
    const userGlobalAttrs = enums.UserGlobalAttributes;
    await models.User.update(update, {where: { id }});
    if (act == enums.ACT_MOVE) {
        await recordMove(id, userinfo.mapNowId, update.mapNowId, userinfo.actPoint - update.actPoint);
    } else {
        await recordApi(id, 'User', update, 2);
    }
    if (update.role == enums.ROLE_FREEMAN) {
        await models.UserTime.create({
            utype: enums.TYPE_USERTIME_FREE,
            userId: id,
            before: JSON.stringify({"User": {role: userinfo.role}}),
            after: JSON.stringify({"User": update}),
            timestamp: new Date()
        });
    }
    updatedKeys.map(key => {
        const val = update[key];
        userinfo[key] = val;
        if (memo_ctl.userMap[id] && memo_ctl.userMap[id].hasOwnProperty(key)) {
            memo_ctl.userMap[id][key] = val;
        }
    });
    if (socket) {
        // emitSocketByte(socket, enums.AUTHORIZE, {act, payload: update});
        memo_ctl.userSockets.map(us => {
            if (us.id == id) {
                emitSocketByte(us.socket, enums.AUTHORIZE, {act, payload: update});
            }
        });
    }
    if (updatedKeys.some(key => { return userGlobalAttrs.includes(key) })) {
        emitGlobalChanges({
            act,
            dataset: [
                { depth: ['users', userinfo.id], update },
            ],
        });
    }
    
    return userinfo
}

async function initConfig() {
    const configs = await models.Config.findAll({where: {open: true}});
    configs.map(c => {
        if (globalConfigs[c.name]) {
            globalConfigs[c.name].value = c.status;
            globalConfigs[c.name].staticKey = c.staticKey;
        }
    });
    if (globalConfigs.round.value == -1) {
        await models.Config.bulkCreate([
            {name: 'round', status: 1, staticKey: '_round_'},
            {name: 'season', status: 1, staticKey: '_season_'},
        ]);
        globalConfigs.round.value = 1;
        globalConfigs.season.value = 1;
    }
    return true
}


async function recordApi(userId, model='', payload={}, curd=0) {
    await models.RecordApi.create({
        userId,
        model,
        payload: JSON.stringify(payload),
        curd,
    });
}

async function recordMove(userId, from, to, spend) {
    await models.RecordMove.create({
        round: globalConfigs.round.value,
        userId: userId,
        fromMapId: from,
        toMapId: to,
        spendPoint: spend,
    });
    return true
}

function hookerHandleBattleFinish(battleChanges, time) {
    console.log('[HookerHandleBattleFinish]: ', time.toLocaleTimeString());
    try {
        const globalChangeDataset = [];
        battleChanges.map(bc => {
            bc.User && bc.User.map(usr => {
                const updateKeys = Object.keys(usr.updated);
                updateKeys.map(k => {
                    memo_ctl.userMap[usr.id][k] = usr.updated[k];
                });
                globalChangeDataset.push({ depth: ['users', usr.id], update: usr.updated });
                memo_ctl.userSockets.map(us => {
                    if (us.id == usr.id) {
                        updateKeys.map(k => {
                            us.userinfo[k] = usr.updated[k];
                        });
                        emitSocketByte(us.socket, enums.AUTHORIZE, {act: enums.AUTHORIZE, payload: usr.updated});
                    }
                });
            });
            bc.RecordWar.map(rw => {
                const thisBattle = memo_ctl.battlefieldMap[rw.mapId];
                const round = globalConfigs.round.value;
                if (rw.winnerCountryId > 0) {   // 有勝敗
                    memo_ctl.warRecords.push({
                        id: thisBattle.id,
                        timestamp: rw.timestamp,
                        mapId: rw.mapId,
                        winnerCountryId: rw.winnerCountryId,
                        attackCountryIds: rw.attackCountryIds,
                        defenceCountryId: rw.defenceCountryId
                    });
                    delete memo_ctl.battlefieldMap[rw.mapId];
                    broadcastSocketByte(enums.MESSAGE, {act: enums.ACT_BATTLE_DONE, payload: {mapId: rw.mapId}});
                    const event = rw.isAttackerWin ? enums.EVENT_WAR_WIN : enums.EVENT_WAR_DEFENCE;
                    const mapIdMap = memo_ctl.mapIdMap;
                    const hasCountryDestoried = rw.isDestoried;
                    const atkCountryName = memo_ctl.countryMap[rw.winnerCountryId].name;
                    const defCountry = memo_ctl.countryMap[rw.defenceCountryId];
                    const defCountryName = memo_ctl.countryMap[rw.defenceCountryId].name;
                    
                    if (rw.isAttackerWin) {
                        mapIdMap[rw.mapId].ownCountryId = rw.winnerCountryId;
                        algorithms.updateHash(rw.mapId, 'country', rw.winnerCountryId);
                        globalChangeDataset.push({ depth: ['maps', rw.mapId], update: {ownCountryId: rw.winnerCountryId} });
                    }
                    if (hasCountryDestoried) {
                        globalChangeDataset.push({ depth: ['countries', rw.defenceCountryId], update: {emperorId: 0, originCityId: 0} });
                        defCountry.emperorId = 0;
                        defCountry.originCityId = 0;
                    }
                    return memo_ctl.eventCtl.broadcastInfo(event, {
                        round,
                        defCountryName,
                        atkCountryName,
                        nicknames: (rw.isAttackerWin ? rw.atkUserIds : rw.defUserIds).filter(i => !!memo_ctl.userMap[i]).map(i => memo_ctl.userMap[i].nickname).join(','),
                        mapName: mapIdMap[rw.mapId].name,
                    }).then(() => {
                        return hasCountryDestoried && memo_ctl.eventCtl.broadcastInfo(enums.EVENT_DESTROY_COUNTRY, {
                            round,
                            defCountryName,
                            atkCountryName,
                        });
                    });
                } else {    // 無勝敗
                    if (memo_ctl.gameMap[rw.gameId]) {
                        Object.keys(rw).map(key => {
                            if (thisBattle.hasOwnProperty(key)) {
                                thisBattle[key] = rw[key];
                            }
                        });
                        broadcastSocketByte(enums.MESSAGE, {act: enums.ACT_BATTLE_GAME_SELECTED, payload: rw});
                        return memo_ctl.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                            round,
                            countryId: thisBattle.defenceCountryId,
                            type: enums.CHINESE_TYPE_BATTLE,
                            content: algorithms.getMsgBattleGameSelected(memo_ctl.mapIdMap[rw.mapId].name, memo_ctl.gameMap[rw.gameId].name),
                        });
                    }
                }
            });
        });
        emitGlobalChanges({
            dataset: globalChangeDataset,
        });
    } catch (err) {
        console.log('[HookerHandleBattleFinish] err: ', err)
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
        initConfig().then(() => {
            console.log('init done globalConfigs: ', globalConfigs);
            return true;
        }).then(() => {
            return refreshBasicData();
        }).then(() => {
            memo_ctl.battleCtl.init(io, memo_ctl.userSockets, memo_ctl.mapIdMap);
            memo_ctl.battleCtl.bindSuccessfulRBF(hookerHandleBattleFinish);
            return memo_ctl.eventCtl.init(broadcastSocketByte);
        }).then(() => {
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
                    address,
                };
                onMessage(socket, updateUserInfo, memo_ctl, globalConfigs);
                emitGlobalGneralArraies(socket, session.userinfo);
                console.log(`A user [${fullUserInfo.nickname}] loaded socket connection.`);
                memo_ctl.userSockets.push({ id: userId, socket, userinfo: session.userinfo });
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
                            return asyncLogin(msg.code, msg.pwd, address).then(e => {
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

        // for quick curl
        socket.on(enums.ADMIN_CONTROL, (msg) => {
            const userinfo = socket.request.session.userinfo;
            if (userinfo.code == 'R343') {
                const modelName = msg.model || '';
                const insModel = models[modelName];
                if (insModel) {
                    try {
                        console.log('[ADMIN_CONTROL] update: ', msg.update,  'user address: ', userinfo.address);
                        insModel.update(msg.update, {where: msg.where}).then(refreshMemoDataUsers);
                    } catch (err) {
                        console.log('ADMIN CTL error: ', err);
                    }
                } else {
                    console.log('Failed. model name wrong: ', msg);
                }
            } else {
                console.log('Failed. userinfo: ', userinfo);
            }
        });

        onDisconnect(socket);
    },
    getMemo() { return memo_ctl; },
    refreshMemoDataUsers,
    initConfig
}
