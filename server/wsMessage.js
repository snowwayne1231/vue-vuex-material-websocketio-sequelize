const enums = require('../src/enum');
const models = require('./models');
const algorithms = require('./websocketctl/algorithm');
const validation = require('./wsValidation');
const { Op } = require("sequelize");


function onMessage(socket, asyncUpdateUserInfo, memoController, configs) {
    
    socket.on(enums.MESSAGE, (msg) => {
        const act = msg.act || '';
        const payload = msg.payload || {};
        const userinfo = socket.request.session.userinfo;
        const validated = validation.validate(act, payload, userinfo, memoController);
        if (!validated.ok) {
            return subEmitMessage(enums.ALERT, {msg: validated.msg, act}); 
        }
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
                const dis = algorithms.getMapDistance(nowId, targetId, userinfo.countryId);
                if (dis > 0 && dis <= userinfo.actPoint) {
                    return asyncUpdateUserInfo(userinfo, {mapNowId: targetId, actPoint: userinfo.actPoint - dis}, act, socket).then(() => {
                        return recordMove(configs.round.value, userinfo.id, nowId, targetId, dis)
                    });
                } else {
                    console.log('[ACT_MOVE] Distance wrong: ', dis)
                }
            } break
            case enums.ACT_LEAVE_COUNTRY: {
                return asyncUpdateUserInfo(userinfo, { countryId: 0, role: enums.ROLE_FREEMAN, actPoint: 0, money: 0, soldier: 0, actPointMax: 3, occupationId: 0 }, act, socket).then(e => {
                    return memoController.eventCtl.broadcastInfo(enums.EVENT_LEAVE_COUNTRY, {nickname: userinfo.nickname, round: configs.round.value});
                });
            }
            case enums.ACT_ENTER_COUNTRY: {
                const mapId = userinfo.mapNowId;
                const thisCountryId = memoController.mapIdMap[mapId].ownCountryId;
                const thisCountry = memoController.countryMap[thisCountryId];
                const ratio = Math.round(Math.random() * 10) / 10;
                console.log('[ACT_ENTER_COUNTRY]: ratio: ', ratio, ' nickname: ', userinfo.nickname);
                if (ratio > 0.3) {
                    return asyncUpdateUserInfo(userinfo, { countryId: thisCountryId, role: enums.ROLE_GENERMAN, actPoint: 0, actPointMax: 7 }, act, socket).then(e => {
                        return memoController.eventCtl.broadcastInfo(enums.EVENT_ENTER_COUNTRY, {nickname: userinfo.nickname, countryName: thisCountry.name, round: configs.round.value});
                    });
                } else {
                    return asyncUpdateUserInfo(userinfo, { actPoint: 0 }, act, socket);
                }
            }
            case enums.ACT_SEARCH_WILD: {
                const randomMoney = Math.round(Math.random() * 100) + 50;
                return asyncUpdateUserInfo(userinfo, { money: userinfo.money + randomMoney, actPoint: userinfo.actPoint-1,  }, act, socket);
            }
            case enums.ACT_BUSINESS: {
                const thisMap = memoController.mapIdMap[userinfo.mapNowId];
                const thisCity = memoController.cityMap[thisMap.cityId];
                const addMoney = thisCity.addResource;
                // console.log('thisCity jsonConstruction: ', thisCity.jsonConstruction);
                const randomMoney = Math.round(Math.random() * 100) + 50 + addMoney;
                return asyncUpdateUserInfo(userinfo, { money: userinfo.money + randomMoney, actPoint: userinfo.actPoint-1,  }, act, socket);
            }
            case enums.ACT_INCREASE_SOLDIER: {
                const randomSoldier = algorithms.randomIncreaseSoldier(userinfo.countryId);
                return asyncUpdateUserInfo(userinfo, { soldier: userinfo.soldier + randomSoldier, actPoint: userinfo.actPoint-1,  }, act, socket);
            }
            case enums.ACT_BATTLE: {
                const mapId = payload.mapId;
                const timeSelected = payload.time;
                const involvedSoldiers = payload.soldier || 0;
                const thisMap = memoController.mapIdMap[mapId];
                const userCountry = memoController.countryMap[userinfo.countryId];
                const usersHere = Object.values(memoController.userMap).filter(u => u.mapNowId == mapId && u.countryId > 0);
                const isFreeWild = usersHere.length == 0 && thisMap.cityId == 0;
                const atkCountryName = userCountry.name;
                if (thisMap.ownCountryId == 0 || isFreeWild) { // empty or wild
                    return asyncUpdateUserInfo(userinfo, {
                        actPoint: userinfo.actPoint - enums.NUM_BATTLE_ACTION_MIN,
                        money: userinfo.money - enums.NUM_BATTLE_MONEY_MIN,
                        soldier: userinfo.soldier - enums.NUM_BATTLE_SOLDIER_MIN,
                        mapNowId: mapId,
                        contribution: userinfo.contribution + enums.NUM_BATTLE_CONTRUBUTION,
                    }, act, socket).then(() => {
                        const update = { ownCountryId: userinfo.countryId };
                        subEmitGlobalChanges({
                            dataset: [ { depth: ['maps', mapId], update } ]
                        });
                        return updateMapOwner(mapId, userinfo.countryId , memoController);
                    }).then(() => {
                        return memoController.eventCtl.broadcastInfo(enums.EVENT_WAR_WIN, {atkCountryName, mapName: thisMap.name, nicknames: userinfo.nickname, round: configs.round.value});
                    });
                }

                return models.RecordWar.findAll({
                    where: { winnerCountryId: 0, timestamp: { [Op.gte]: new Date() } },
                    attributes: ['timestamp', 'detail', 'round', 'mapId'],
                    order: [['timestamp', 'DESC']]
                }).then(wars => {
                    const warTimestamps = wars.map(w => new Date(w.timestamp).getTime());
                    if (timeSelected) {
                        if (!involvedSoldiers || userinfo.soldier < involvedSoldiers) {
                            return subEmitMessage(enums.ALERT, {msg: 'Involved soldier wrong.', act});
                        } else if (warTimestamps.includes(timeSelected)) {
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
                                detail: {
                                    atkSoldiers: [involvedSoldiers, 0, 0, 0],
                                    defSoldiers: [0, 0, 0, 0],
                                    atkSoldierLoses: [0, 0, 0, 0],
                                    defSoldierLoses: [0, 0, 0, 0],
                                }
                            }, memoController);
                        }
                        return subEmitMessage(enums.ALERT, {msg: 'Not validated time.', act});
                    } else {
                        const timeOptions = algorithms.getTimeOptions(warTimestamps);
                        return subEmitMessage(act, {mapId, options: timeOptions.map(t => t.getTime())});
                    }
                }).then(e => {
                    if (e && e.id) {    // RecordWar create successful.
                        console.log('[ACT_BATTLE] RecordWar create successful. ', e.timestamp);
                        const defCountryName = memoController.countryMap[thisMap.ownCountryId].name;
                        return asyncUpdateUserInfo(userinfo, {
                            actPoint: userinfo.actPoint -  enums.NUM_BATTLE_ACTION_MIN,
                            money: userinfo.money - enums.NUM_BATTLE_MONEY_MIN,
                            // soldier: userinfo.soldier - involvedSoldiers,
                            contribution: userinfo.contribution + enums.NUM_BATTLE_CONTRUBUTION,
                            mapTargetId: mapId,
                        }, act, socket).then(() => {
                            const event = thisMap.cityId > 0 ? enums.EVENT_WAR_CITY : enums.EVENT_WAR_WILD;
                            return memoController.eventCtl.broadcastInfo(event, {atkCountryName, mapName: thisMap.name, defCountryName, round: configs.round.value});
                        });
                    }
                });
            }
            case enums.ACT_BATTLE_JOIN: {
                const mapId = payload.mapId;
                const battleId = payload.battleId;
                const position = payload.position; // 0~3 = 戰鬥位置 4 = 裁判 5 = 工具人
                const involvedSoldiers = payload.soldier;
                const thisBattle = mapId ? memoController.battlefieldMap[mapId] : null;
                const isAtkCountry = thisBattle.attackCountryIds.includes(userinfo.countryId);
                
                if ([4,5].includes(position)) {
                    const bdata = {};
                    if (position == 4) {
                        bdata.judgeId = userinfo.id;
                    }
                    if (position == 5) {
                        bdata.toolmanId = userinfo.id;
                    }
                    return updateRecordWar(battleId, mapId, bdata, memoController).then(e => {
                        return e ? asyncUpdateUserInfo(userinfo, {
                            contribution: userinfo.contribution + enums.NUM_BATTLE_TOOLMANS_CONTRUBUTION
                        }, act, socket) : null;
                    });
                } else if (position >= 0 && userinfo.role != enums.ROLE_FREEMAN && involvedSoldiers > 0 && involvedSoldiers <= userinfo.soldier) {
                    const bdata = {detail: thisBattle.detail};
                    const actSpend = algorithms.getMapDistance(userinfo.mapNowId, mapId);
                    const isDefenceSite = userinfo.countryId == thisBattle.defenceCountryId;
                    const battleTime = new Date(thisBattle.timestamp);
                    battleTime.setDate(battleTime.getDate() - 3);
                    if (new Date().getTime() > battleTime.getTime()) { break }
                    if (userinfo.actPoint < actSpend && userinfo.money < enums.NUM_BATTLE_MONEY_MIN) { break }

                    if (isDefenceSite && thisBattle.defUserIds[position] == 0) {
                        bdata.defUserIds = thisBattle.defUserIds.slice();
                        bdata.defUserIds[position] = userinfo.id;
                        bdata.detail.defSoldiers[position] = involvedSoldiers;
                    } else if (isAtkCountry && thisBattle.atkUserIds[position] == 0) {
                        bdata.atkUserIds = thisBattle.atkUserIds.slice();
                        bdata.atkUserIds[position] = userinfo.id;
                        bdata.detail.atkSoldiers[position] = involvedSoldiers;
                    } else { break }

                    return updateRecordWar(battleId, mapId, bdata, memoController).then(e => {
                        return e ? asyncUpdateUserInfo(userinfo, {
                            contribution: userinfo.contribution + enums.NUM_BATTLE_CONTRUBUTION,
                            actPoint: userinfo.actPoint - actSpend,
                            money: userinfo.money - enums.NUM_BATTLE_MONEY_MIN,
                            // soldier: userinfo.soldier - soldierSpend,
                            mapTargetId: mapId,
                            mapNowId: isDefenceSite ? mapId : userinfo.mapNowId,
                        }, act, socket) : null;
                    });
                }
            } break
            case enums.ACT_BATTLE_JUDGE: {
                const mapId = payload.mapId;
                const battleId = payload.battleId;
                const winId = payload.winId;

                const battlefieldMap = memoController.battlefieldMap;
                const thisBattle = battlefieldMap[mapId];
                const battleKeys = Object.keys(battlefieldMap);
                let isAllowedTime = thisBattle.timestamp.getTime() < new Date().getTime();
                if (battleKeys.length > 0) {
                    const olderestBattleKey = battleKeys.sort((a,b) => {
                        return battlefieldMap[a].timestamp.getTime() - battlefieldMap[b].timestamp.getTime();
                    })[0];
                    if (olderestBattleKey != mapId) {
                        isAllowedTime = false;
                    }
                }
                
                if ((isAllowedTime && thisBattle.judgeId == userinfo.id) || algorithms.isWelfare(userinfo)) {
                    const isAttackerWin = thisBattle.attackCountryIds.includes(winId);
                    const defWin = thisBattle.defenceCountryId == winId;
                    if (isAttackerWin || defWin) {
                        return models.RecordWar.findOne({where: {id:battleId}}).then(war => {
                            memoController.battleCtl.handleWarWinner(war, isAttackerWin, true);
                        });
                    }
                }
            } break
            case enums.ACT_APPOINTMENT: {

            } break
            case enums.ACT_DISMISS: {

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
        broadcastSocket(memoController, {act, payload});
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

function broadcastSocket(memoctl, data) {
    return memoctl.broadcast(enums.MESSAGE, data);
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

async function RecordWar(data, memoController) {
    const rw = await models.RecordWar.create(data);
    const jsondata = rw.toJSON();
    const mapId = jsondata.mapId;
    memoController.battlefieldMap[mapId] = jsondata;
    broadcastSocket(memoController, {act: enums.ACT_BATTLE_ADD, payload: { mapId, jsondata }});
    return jsondata
}

async function updateRecordWar(id, mapId, data, memoController) {
    await models.RecordWar.update(data, {where: {id}});
    Object.keys(data).map(key => {
        memoController.battlefieldMap[mapId][key] = data[key];
    });
    if (data.winnerCountryId == 1) {
        broadcastSocket(memoController, {act: enums.ACT_BATTLE_DONE, payload: { mapId }});
    } else {
        const jsondata = memoController.battlefieldMap[mapId];
        broadcastSocket(memoController, {act: enums.ACT_BATTLE_ADD, payload: { mapId, jsondata }});
    }
    return true
}

module.exports = onMessage