const enums = require('../src/enum');
const models = require('./models');
const algorithms = require('./websocketctl/algorithm');
const events = require('./events');
const { Op } = require("sequelize");
events.init();

function onMessage(socket, asyncUpdateUserInfo, memoController, configs) {

    socket.on(enums.MESSAGE, (msg) => {
        const act = msg.act || '';
        const payload = msg.payload || {};
        const userinfo = socket.request.session.userinfo;
        let switched = subSwitchOnMessage(act, payload, userinfo);
        return switched && switched.catch && switched.catch(err => console.log(err));
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
                const existedTargetId = userinfo.mapTargetId;
                const targetMap = memoController.mapIdMap[targetId];
                if (targetMap && existedTargetId == 0) {
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
            } break
            case enums.ACT_LEAVE_COUNTRY: {
                if (userinfo.actPoint > 0 && userinfo.role == 2 && (userinfo.loyalUserId == 0 || userinfo.destoryByCountryIds.length > 0) && userinfo.mapTargetId == 0) {
                    return asyncUpdateUserInfo(userinfo, { countryId: 0, role: enums.ROLE_FREEMAN, actPoint: 0, money: 0, soldier: 0, actPointMax: 3 }, act, socket).then(e => {
                        const noti = events.getInfo(enums.EVENT_LEAVE_COUNTRY, {nickname: userinfo.nickname});
                        recordEvent(configs.round.value, events.getId(enums.EVENT_LEAVE_COUNTRY), noti, memoController);
                    });
                }
            } break
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
                            return asyncUpdateUserInfo(userinfo, { countryId: thisCountryId, role: enums.ROLE_GENERMAN, actPoint: 0, actPointMax: 7 }, act, socket).then(e => {
                                const noti = events.getInfo(enums.EVENT_ENTER_COUNTRY, {nickname: userinfo.nickname, countryName: thisCountry.name});
                                recordEvent(configs.round.value, events.getId(enums.EVENT_ENTER_COUNTRY), noti, memoController);
                            });
                        } else {
                            return asyncUpdateUserInfo(userinfo, { actPoint: 0 }, act, socket);
                        }
                    }
                }
            } break
            case enums.ACT_SEARCH_WILD: {
                const mapId = userinfo.mapNowId;
                const thisMap = memoController.mapIdMap[mapId];
                if (userinfo.actPoint > 0 && userinfo.role !== enums.ROLE_FREEMAN && thisMap && thisMap.type === enums.TYPE_WILD) {
                    const randomMoney = Math.round(Math.random() * 100) + 50;
                    return asyncUpdateUserInfo(userinfo, { money: userinfo.money + randomMoney, actPoint: userinfo.actPoint-1,  }, act, socket);
                }
            } break
            case enums.ACT_INCREASE_SOLDIER: {
                const mapId = userinfo.mapNowId;
                const thisMap = memoController.mapIdMap[mapId];
                if (userinfo.actPoint > 0 && userinfo.role !== enums.ROLE_FREEMAN && thisMap && thisMap.type === enums.TYPE_CITY) {
                    const randomSoldier = Math.round(Math.random() * 200) + 100;
                    return asyncUpdateUserInfo(userinfo, { soldier: userinfo.soldier + randomSoldier, actPoint: userinfo.actPoint-1,  }, act, socket);
                }
            } break
            case enums.ACT_BATTLE: {
                const mapId = payload.mapId;
                const timeSelected = payload.time;
                const thisMap = memoController.mapIdMap[mapId];
                const userCountry = memoController.countryMap[userinfo.countryId];
                const notExistBattlefield = !memoController.battlefieldMap[mapId];
                if (thisMap && thisMap.ownCountryId != userinfo.countryId && userCountry && notExistBattlefield && userinfo.mapTargetId == 0) {
                    const actSpend = 1;
                    const moneySpend = 100;
                    const soldierSpend = 1000;
                    const increaseContribution = 6;
                    
                    if (userinfo.actPoint >= actSpend && userinfo.money >= moneySpend && userinfo.soldier >= soldierSpend) { // enough resource
                        const usersHere = Object.values(memoController.userMap).filter(u => u.mapNowId == mapId && u.countryId > 0);
                        const isFreeWild = usersHere.length == 0 && thisMap.cityId == 0;
                        const atkCountryName = userCountry.name;
                        if (thisMap.ownCountryId == 0 || isFreeWild) { // empty or wild
                            return asyncUpdateUserInfo(userinfo, {
                                actPoint: userinfo.actPoint - actSpend,
                                money: userinfo.money - moneySpend,
                                soldier: userinfo.soldier - soldierSpend,
                                mapNowId: mapId,
                                contribution: userinfo.contribution + increaseContribution,
                            }, act, socket).then(() => {
                                const update = { ownCountryId: userinfo.countryId };
                                subEmitGlobalChanges({
                                    dataset: [ { depth: ['maps', mapId], update } ]
                                });
                                return updateMapOwner(mapId, userinfo.countryId , memoController);
                            }).then(() => {
                                const noti = events.getInfo(enums.EVENT_WAR_WIN, {atkCountryName, mapName: thisMap.name, nicknames: userinfo.nickname});
                                return recordEvent(configs.round.value, events.getId(enums.EVENT_WAR_WIN), noti, memoController);
                            });
                        }

                        return models.RecordWar.findAll({
                            where: { winnerCountryId: 0, timestamp: { [Op.gte]: new Date() } },
                            attributes: ['timestamp', 'detail', 'round', 'mapId'],
                            order: [['timestamp', 'DESC']]
                        }).then(wars => {
                            const warTimestamps = wars.map(w => new Date(w.timestamp).getTime());
                            if (timeSelected) {
                                if (warTimestamps.includes(timeSelected)) {
                                    return subEmitMessage(enums.ALERT, {msg: 'Already aragnemented time.', act});
                                } else if (algorithms.isValidatedBattleTime(timeSelected) && wars.findIndex(w => w.mapId == mapId) == -1) {
                                    subEmitMessage(act, {mapId});
                                    return RecordWar({
                                        round: configs.round.value,
                                        timestamp: new Date(timeSelected),
                                        mapId: mapId,
                                        defenceCountryId: thisMap.ownCountryId,
                                        attackCountryIds: [userinfo.countryId],
                                        atkUserIds: [userinfo.id, 0, 0, 0],
                                        defUserIds: [0, 0, 0, 0],
                                        detail: {}
                                    }, memoController);
                                }
                                return subEmitMessage(enums.ALERT, {msg: 'Not validated time.', act});
                            } else {
                                const timeOptions = algorithms.getTimeOptions(warTimestamps);
                                return subEmitMessage(act, {mapId, options: timeOptions.map(t => t.getTime())});
                            }
                        }).then(e => {
                            if (e && e.id) {    // RecordWar create successful.
                                console.log('RecordWar create successful. ', e.timestamp);
                                const defCountryName = memoController.countryMap[thisMap.ownCountryId].name;
                                return asyncUpdateUserInfo(userinfo, {
                                    actPoint: userinfo.actPoint - actSpend,
                                    money: userinfo.money - moneySpend,
                                    soldier: userinfo.soldier - soldierSpend,
                                    contribution: userinfo.contribution + increaseContribution,
                                    mapTargetId: mapId,
                                }, act, socket).then(() => {
                                    const event = thisMap.cityId > 0 ? enums.EVENT_WAR_CITY : enums.EVENT_WAR_WILD;
                                    const noti = events.getInfo(event, {atkCountryName, mapName: thisMap.name, defCountryName});
                                    return recordEvent(configs.round.value, events.getId(event), noti, memoController);
                                });
                            }
                        });
                    }
                }
            } break
            case enums.ACT_BATTLE_JOIN: {
                const mapId = payload.mapId;
                const battleId = payload.battleId;
                const position = payload.position; // 0~3 = 戰鬥位置 4 = 裁判 5 = 工具人
                const thisMap = mapId ? memoController.mapIdMap[mapId] : null;
                const thisBattle = mapId ? memoController.battlefieldMap[mapId] : null;
                const isAtkCountry = thisBattle.attackCountryIds.includes(userinfo.countryId);
                
                if (thisBattle && thisMap && thisBattle.id == battleId && userinfo.mapTargetId == 0) {
                    if ([4,5].includes(position)) {
                        const increaseContribution = 12;
                        const bdata = {};
                        if (position == 4) {
                            bdata.judgeId = userinfo.id;
                            if (thisBattle.judgeId > 0) break
                        }
                        if (position == 5) {
                            bdata.toolmanId = userinfo.id;
                            if (thisBattle.toolmanId > 0) break
                        }
                        if (userinfo.countryId == thisBattle.defenceCountryId || isAtkCountry) { // is involved country
                            break
                        }
                        return updateRecordWar(battleId, mapId, bdata, memoController).then(e => {
                            return e ? asyncUpdateUserInfo(userinfo, {
                                contribution: userinfo.contribution + increaseContribution
                            }, act, socket) : null;
                        });
                    } else if (position >= 0 && userinfo.role != enums.ROLE_FREEMAN && algorithms.getMapDistance(userinfo.mapNowId, mapId) <= 1) {
                        const bdata = {};
                        const increaseContribution = 6;
                        const actSpend = 1;
                        const moneySpend = 100;
                        const soldierSpend = 1000;
                        const isDefenceSite = userinfo.countryId == thisBattle.defenceCountryId;
                        const battleTime = new Date(thisBattle.timestamp);
                        battleTime.setDate(battleTime.getDate() - 3);
                        if (new Date().getTime() > battleTime.getTime()) { break }
                        if (userinfo.actPoint >= actSpend && userinfo.money >= moneySpend && userinfo.soldier >= soldierSpend) { break }

                        if (isDefenceSite && thisBattle.defUserIds[position] == 0) {
                            bdata.defUserIds = thisBattle.defUserIds.slice();
                            bdata.defUserIds[position] = userinfo.id;
                        } else if (isAtkCountry && thisBattle.atkUserIds[position] == 0) {
                            bdata.atkUserIds = thisBattle.atkUserIds.slice();
                            bdata.atkUserIds[position] = userinfo.id;
                        } else { break }

                        return updateRecordWar(battleId, mapId, bdata, memoController).then(e => {
                            return e ? asyncUpdateUserInfo(userinfo, {
                                contribution: userinfo.contribution + increaseContribution,
                                actPoint: userinfo.actPoint - actSpend,
                                money: userinfo.money - moneySpend,
                                soldier: userinfo.soldier - soldierSpend,
                                mapTargetId: mapId,
                            }, act, socket) : null;
                        });
                    }
                }
            } break
            case enums.ACT_BATTLE_JUDGE: {

            } break
            
            default:
                console.log("Not Found Act: ", act);
        }
        console.log('Be General Failed. [ ', userinfo.nickname, ' ] act: ', act, 'payload: ', payload);
        return subEmitMessage(enums.ALERT, {msg: 'Failed.', act}); 
    }

    function subEmitMessage(act, payload) {
        emitSocketByte(socket, {act, payload});
        return ![enums.ALERT].includes(act); 
    }

    function subBroadcast(act, payload) {
        broadcastSocketByte(memoController, {act, payload});
        return true
    }

    function subEmitGlobalChanges(changes = {dataset: [{ depth: [], update: {} }]}) {
        return subBroadcast(enums.ACT_GET_GLOBAL_CHANGE_DATA, changes)
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


async function updateMapOwner(mapId, countryId, memoController=null) {
    await models.Map.update({
        ownCountryId: countryId,
    }, {where: { id: mapId }});
    if (memoController) {
        memoController.mapIdMap[mapId].ownCountryId = countryId;
        algorithms.updateHash(mapId, 'country', countryId);
    }
    return true
}

async function recordMove(round, userId, from, to, spend) {
    await models.RecordMove.create({
        round: round,
        userId: userId,
        fromMapId: from,
        toMapId: to,
        spendPoint: spend,
    });
    return true
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
    return true
}

async function RecordWar(data, memoController) {
    const rw = await models.RecordWar.create(data);
    const jsondata = rw.toJSON();
    const mapId = jsondata.mapId;
    memoController.battlefieldMap[mapId] = jsondata;
    broadcastSocketByte(memoController, {act: enums.ACT_BATTLE_ADD, payload: { mapId, jsondata }});
    return jsondata
}

async function updateRecordWar(id, mapId, data, memoController) {
    await models.RecordWar.update(data, {where: {id}});
    Object.keys(data).map(key => {
        memoController.battlefieldMap[mapId][key] = data[key];
    });
    if (data.winnerCountryId == 1) {
        broadcastSocketByte(memoController, {act: enums.ACT_BATTLE_DONE, payload: { mapId }});
    } else {
        const jsondata = memoController.battlefieldMap[mapId];
        broadcastSocketByte(memoController, {act: enums.ACT_BATTLE_ADD, payload: { mapId, jsondata }});
    }
    return true
}

module.exports = onMessage