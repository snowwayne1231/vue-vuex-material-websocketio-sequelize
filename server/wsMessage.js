const enums = require('../src/enum');
const models = require('./models');
const algorithms = require('./websocketctl/algorithm');
const events = require('./events');
events.init();

function onMessage(socket, asyncUpdateUserInfo, memoController, configs) {

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
                let users = Object.values(memoController.userMap).map(user => {
                    let _ = [];
                    ugAttributes.map(col => { _.push(user[col]); });
                    return _;
                });
                return subEmitMessage(act, {users});
            }
            case enums.ACT_MOVE: {
                const targetId = payload;
                const nowId = userinfo.mapNowId;
                const targetMap = memoController.mapIdMap[targetId];
                if (targetMap) {
                    const dis = algorithms.getMapDistance(nowId, targetId, userinfo.countryId);
                    if (userinfo.countryId == 0 || targetMap.ownCountryId == userinfo.countryId) {
                        if (dis > 0 && dis <= userinfo.actPoint) {
                            return asyncUpdateUserInfo(userinfo, {mapNowId: targetId, actPoint: userinfo.actPoint - dis}, act, socket).then(() => {
                                return recordMove(configs.round.value, userinfo.id, nowId, targetId, dis)
                            });
                        } else {
                            console.log('[ACT_MOVE] Distance wrong: ', dis)
                        }
                    } else {
                        console.log('[ACT_MOVE] userinfo wrong: ', userinfo)
                    }
                }
                return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
            }
            case enums.ACT_LEAVE_COUNTRY: {
                if (userinfo.actPoint > 0 && userinfo.role == 2 && (userinfo.loyalUserId == 0 || userinfo.destoryByCountryIds.length > 0)) {
                    
                    return asyncUpdateUserInfo(userinfo, { countryId: 0, role: enums.ROLE_FREEMAN, actPoint: 1000, money: 0, soldier: 0 }, act, socket).then(e => {
                        const noti = events.getInfo(enums.EVENT_LEAVE_COUNTRY, {nickname: userinfo.nickname});
                        recordEvent(configs.round.value, events.getId(enums.EVENT_LEAVE_COUNTRY), noti, memoController);
                        
                    });
                } else {
                    return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
                }
            }
            case enums.ACT_ENTER_COUNTRY: {
                const mapId = userinfo.mapNowId;
                const thisMap = memoController.mapIdMap[mapId];
                if (thisMap && userinfo.actPoint > 0 && userinfo.countryId == 0) {
                    const thisCountryId = thisMap.ownCountryId;
                    const dbciAry = Array.isArray(userinfo.destoryByCountryIds) ? userinfo.destoryByCountryIds : [];
                    const thisCountry = memoController.countryMap[thisCountryId];
                    if (thisCountryId > 0 && thisCountry && !dbciAry.includes(thisCountryId)) {
                        const ratio = Math.round(Math.random() * 10) / 10;
                        if (ratio > 0.5) {
                            return asyncUpdateUserInfo(userinfo, { countryId: thisCountryId, role: enums.ROLE_GENERMAN, actPoint: 1000 }, act, socket).then(e => {
                                const noti = events.getInfo(enums.EVENT_ENTER_COUNTRY, {nickname: userinfo.nickname, countryName: thisCountry.name});
                                recordEvent(configs.round.value, events.getId(enums.EVENT_ENTER_COUNTRY), noti, memoController);
                            });
                        } else {
                            return asyncUpdateUserInfo(userinfo, { actPoint: 1000 }, act, socket);
                        }
                    }
                }
                return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
            }
            case enums.ACT_SEARCH_WILD: {
                const mapId = userinfo.mapNowId;
                const thisMap = memoController.mapIdMap[mapId];
                if (userinfo.actPoint > 0 && userinfo.role !== enums.ROLE_FREEMAN && thisMap && thisMap.type === enums.TYPE_WILD) {
                    const randomMoney = Math.round(Math.random() * 100) + 50;
                    return asyncUpdateUserInfo(userinfo, { money: userinfo.money + randomMoney, actPoint: userinfo.actPoint-1,  }, act, socket);
                }
                return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
            }
            case enums.ACT_INCREASE_SOLDIER: {
                const mapId = userinfo.mapNowId;
                const thisMap = memoController.mapIdMap[mapId];
                if (userinfo.actPoint > 0 && userinfo.role !== enums.ROLE_FREEMAN && thisMap && thisMap.type === enums.TYPE_CITY) {
                    const randomSoldier = Math.round(Math.random() * 200) + 100;
                    return asyncUpdateUserInfo(userinfo, { soldier: userinfo.soldier + randomSoldier, actPoint: userinfo.actPoint-1,  }, act, socket);
                }
                return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
            }
            
            default:
                console.log("Not Found Act: ", act);
        }
        return null;
    }

    function subEmitMessage(act, payload) {
        emitSocketByte(socket, {act, payload});
    }

    function subBroadcast(act, payload) {
        broadcastSocketByte(memoController, {act, payload});
    }
}



function emitSocketByte(socket, data) {
    var buf = Buffer.from(JSON.stringify(data), 'utf-8');
    socket.emit(enums.MESSAGE, buf);
    return socket;
}

function broadcastSocketByte(memoctl, data) {
    var buf = Buffer.from(JSON.stringify(data), 'utf-8');
    return memoctl.websocket.emit(enums.MESSAGE, buf);
}



async function recordMove(round, userId, from, to, spend) {
    await models.RecordMove.create({
        round: round,
        userId: userId,
        fromMapId: from,
        toMapId: to,
        spendPoint: spend,
    });
}

async function recordEvent(round, eventId, detail, memoController=null) {
    const timestamp = new Date();
    await models.RecordEvent.create({
        round,
        eventId,
        detail,
        timestamp,
    });
    if (memoController) {
        const payload = [timestamp, detail];
        memoController.eventRecords.unshift(payload);
        if (memoController.eventRecords.length > 20) {
            memoController.eventRecords.splice(-1, 1);
        }
        broadcastSocketByte(memoController, {act: enums.ACT_NOTIFICATION, payload});
    }
}

module.exports = onMessage