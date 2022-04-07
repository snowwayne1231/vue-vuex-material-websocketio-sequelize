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
        return switched && switched.catch && switched.catch(err => console.log('[Error] ', err));
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
                    const discount = getCityConstruction(nowId, 'stable', memoController).lv;
                    const spendPoint = Math.max(1, dis - discount);
                    return asyncUpdateUserInfo(userinfo, {mapNowId: targetId, actPoint: userinfo.actPoint - spendPoint}, act, socket);
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
                if (ratio > 0.45) {
                    return asyncUpdateUserInfo(userinfo, { countryId: thisCountryId, role: enums.ROLE_GENERMAN, actPoint: 0, actPointMax: 7, loyalUserId: 0 }, act, socket).then(e => {
                        return memoController.eventCtl.broadcastInfo(enums.EVENT_ENTER_COUNTRY, {nickname: userinfo.nickname, countryName: thisCountry.name, round: configs.round.value});
                    });
                } else {
                    return asyncUpdateUserInfo(userinfo, { actPoint: 0 }, act, socket);
                }
            }
            case enums.ACT_SEARCH_WILD: {
                const randomMoney = Math.round(Math.random() * 100) + 50;
                const maxMoney = 150;
                const isLucky = randomMoney / maxMoney > 0.97;
                return asyncUpdateUserInfo(userinfo, { money: userinfo.money + randomMoney, actPoint: userinfo.actPoint-1,  }, act, socket).then(() => {
                    return isLucky && memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                        round: configs.round.value,
                        countryId: userinfo.countryId,
                        type: enums.CHINESE_TYPE_DOMESTIC,
                        content: algorithms.getMsgLuckyMoney(userinfo.nickname, randomMoney),
                    });
                });
            }
            case enums.ACT_BUSINESS: {
                const thisMap = memoController.mapIdMap[userinfo.mapNowId];
                const thisCity = memoController.cityMap[thisMap.cityId];
                const addMoney = thisCity.addResource;
                const randomMoney = Math.round(Math.random() * 100) + 50 + addMoney;
                const construction = getCityConstruction(userinfo.mapNowId, 'market', memoController);
                const additionalMoney = construction.lv * enums.NUM_ADDITIONAL_MARKET_MONEY;
                const maxMoney = 150 + addMoney;
                const isLucky = randomMoney / maxMoney > 0.97;
                return asyncUpdateUserInfo(userinfo, { money: userinfo.money + randomMoney + additionalMoney, actPoint: userinfo.actPoint-1 }, act, socket).then(() => {
                    return isLucky && memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                        round: configs.round.value,
                        countryId: userinfo.countryId,
                        type: enums.CHINESE_TYPE_DOMESTIC,
                        content: algorithms.getMsgLuckyMoney(userinfo.nickname, randomMoney + additionalMoney, true),
                    });
                });
            }
            case enums.ACT_INCREASE_SOLDIER: {
                const randomSoldier = algorithms.randomIncreaseSoldier(userinfo.countryId);
                const construction = getCityConstruction(userinfo.mapNowId, 'barrack', memoController);
                const additionalSoldier = construction.lv * enums.NUM_ADDITIONAL_BARRACK_SOLDIER;
                const isLucky = randomSoldier.lucky;
                return asyncUpdateUserInfo(userinfo, { soldier: userinfo.soldier + randomSoldier.add + additionalSoldier, actPoint: userinfo.actPoint-1 }, act, socket).then(() => {
                    return isLucky && memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                        round: configs.round.value,
                        countryId: userinfo.countryId,
                        type: enums.CHINESE_TYPE_DOMESTIC,
                        content: algorithms.getMsgLuckySoldier(userinfo.nickname, randomSoldier.add + additionalSoldier),
                    });
                });
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
                const noCountry = thisMap.ownCountryId == 0;
                if (noCountry || isFreeWild) { // empty or wild
                    return asyncUpdateUserInfo(userinfo, {
                        actPoint: userinfo.actPoint - enums.NUM_BATTLE_ACTION_MIN,
                        money: userinfo.money - enums.NUM_BATTLE_MONEY_MIN,
                        soldier: userinfo.soldier - (noCountry ? enums.NUM_BATTLE_SOLDIER_MIN : 0),
                        mapNowId: mapId,
                        contribution: userinfo.contribution + enums.NUM_BATTLE_CONTRUBUTION,
                    }, act, socket).then(() => {
                        const update = { ownCountryId: userinfo.countryId };
                        subEmitGlobalChanges({
                            dataset: [ { depth: ['maps', mapId], update } ]
                        });
                        return updateMapOwner(mapId, userinfo.countryId , userinfo, memoController);
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
                            const construction = getCityConstruction(mapId, 'wall', memoController);
                            const wallDefence = (construction.lv * enums.NUM_ADDITIONAL_WALL_TRAPEZOID) + enums.NUM_BATTLE_SOLDIER_MIN;
                            if (involvedSoldiers < wallDefence) {
                                return subEmitMessage(enums.ALERT, {msg: 'Attack Soldier Less Than City Defence.', act});
                            }
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
                            return memoController.eventCtl.broadcastInfo(event, {atkCountryName, mapName: `${thisMap.name}`, defCountryName, round: configs.round.value});
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
                    if (userinfo.actPoint < 1) { break }
                    if (position == 4) {
                        bdata.judgeId = userinfo.id;
                    }
                    if (position == 5) {
                        bdata.toolmanId = userinfo.id;
                    }
                    return updateRecordWar(battleId, mapId, bdata, memoController).then(e => {
                        return e ? asyncUpdateUserInfo(userinfo, {
                            actPoint: userinfo.actPoint - 1,
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
                    if (userinfo.actPoint < actSpend || userinfo.money < enums.NUM_BATTLE_MONEY_MIN) { break }

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
                    }).then(() => {
                        return memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                            round: configs.round.value,
                            countryId: userinfo.countryId,
                            type: enums.CHINESE_TYPE_BATTLE,
                            content: algorithms.getMsgJoinBattle(userinfo.nickname, involvedSoldiers, memoController.mapIdMap[mapId].name),
                        });
                    });
                }
            } break
            case enums.ACT_BATTLE_JUDGE: {
                const mapId = payload.mapId;
                const battleId = payload.battleId;
                const winId = payload.winId;
                const battlefieldMap = memoController.battlefieldMap;
                const thisBattle = battlefieldMap[mapId];
                const isAttackerWin = thisBattle.attackCountryIds.includes(winId);
                const defWin = thisBattle.defenceCountryId == winId;
                if (isAttackerWin || defWin) {
                    return models.RecordWar.findOne({where: {id:battleId}}).then(war => {
                        memoController.battleCtl.handleWarWinner(war, isAttackerWin, true);
                    });
                }
            } break
            case enums.ACT_APPOINTMENT: {
                const userId = payload.userId;
                const occupationId = payload.occupationId;
                const occupation = memoController.occupationMap[occupationId]
                const actPointMax = occupation.addActPoint + 7;
                return updateSingleUser(userId, {occupationId, actPointMax}, userinfo, memoController).then(e => {
                    if (e) {
                        const user = memoController.userMap[userId];
                        const nickname = user.nickname;
                        // const countryName = memoController.countryMap[user.countryId].name;
                        const countryName = ' ';
                        const occupationName = occupation.name;
                        return asyncUpdateUserInfo(userinfo, {
                            actPoint: userinfo.actPoint - 3,
                        }, act, socket).then(() => {
                            return memoController.eventCtl.broadcastInfo(enums.EVENT_OCCUPATION, {
                                round: configs.round.value,
                                countryId: user.countryId,
                                countryName,
                                nickname,
                                occupationName
                            });
                        });
                    }
                    return null;
                });
            }
            case enums.ACT_DISMISS: {
                const userId = payload.userId;
                return updateSingleUser(userId, {occupationId: 0, actPointMax: 7}, userinfo, memoController).then(e => {
                    return e ? asyncUpdateUserInfo(userinfo, {
                        actPoint: userinfo.actPoint - 1,
                    }, act, socket) : null;
                });
            }
            case enums.ACT_LEVELUP_CITY: {
                const cityId = payload.cityId;
                const constructionName = payload.constructionName;
                const city = memoController.cityMap[cityId];
                const update = {
                    jsonConstruction: {...city.jsonConstruction}
                };
                const next_lv = city.jsonConstruction[constructionName].lv + 1;
                const pirce = next_lv * enums.NUM_LEVELUP_TRAPEZOID_SPENDING;
                update.jsonConstruction[constructionName].lv = next_lv;
                return updateCity(cityId, update, userinfo, memoController).then(e => {
                    return e ? asyncUpdateUserInfo(userinfo, {
                        actPoint: userinfo.actPoint - 1,
                        money: userinfo.money - pirce,
                        contribution: userinfo.contribution + enums.NUM_BATTLE_CONTRUBUTION,
                    }, act, socket) : null;
                }).then(() => {
                    return memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                        round: configs.round.value,
                        countryId: userinfo.countryId,
                        type: enums.CHINESE_TYPE_DOMESTIC,
                        content: algorithms.getMsgLevelUp(userinfo.nickname, constructionName, city.name, next_lv),
                    });
                });
            }
            case enums.ACT_SHARE: {
                const userId = payload.userId;
                const soldier = payload.soldier;
                const money = payload.money;
                const targetUser = memoController.userMap[userId];
                // const packetId = payload.packetId;
                return updateSingleUser(userId, {soldier: targetUser.soldier + soldier, money: targetUser.money + money}, userinfo, memoController).then(e => {
                    return e ? asyncUpdateUserInfo(userinfo, {
                        actPoint: userinfo.actPoint - 1,
                        soldier: userinfo.soldier - soldier,
                        money: userinfo.money - money,
                    }, act, socket).then(() => {
                        return memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                            round: configs.round.value,
                            countryId: userinfo.countryId,
                            type: enums.CHINESE_TYPE_DOMESTIC,
                            content: algorithms.getMsgShare(userinfo.nickname, targetUser.nickname, money, soldier),
                        });
                    }) : null;
                });
            }
            case enums.ACT_ESCAPE: {
                const happenRatio = 10;
                const money = payload.money;
                const successRatio = Math.round(Math.random() * 100) + Math.round(money / 100);
                console.log('[ACT_ESCAPE] user: ', userinfo.nickname, ' successRatio: ', successRatio);
                const successful = successRatio >= (100 - happenRatio);
                const updateData = {
                    actPoint: userinfo.actPoint - 1,
                    money: userinfo.money - money,
                };
                if (successful) {
                    const cityId = memoController.countryMap[userinfo.countryId].originCityId;
                    let mapId = algorithms.getMapIdByCityId(cityId);
                    updateData.mapNowId = mapId;
                    updateData.captiveDate = null;
                }
                return asyncUpdateUserInfo(userinfo, updateData, act, socket).then(user => {
                    if (successful) {
                        memoController.eventCtl.broadcastInfo(enums.EVENT_CAPTIVE_ESCAPE, {
                            nickname: user.nickname,
                            round: configs.round.value
                        });
                    }
                });
            }
            case enums.ACT_BATTLE_SELECT_GAME: {
                const battleId = payload.battleId;
                const mapId = payload.mapId;
                const gameId = payload.gameId;
                return updateRecordWar(battleId, mapId, {gameId}, memoController).then(e => {
                    broadcastSocketByte(enums.MESSAGE, {act: enums.ACT_BATTLE_GAME_SELECTED, payload});
                    return memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                        round: configs.round.value,
                        countryId: userinfo.countryId,
                        type: enums.CHINESE_TYPE_BATTLE,
                        content: algorithms.getMsgBattleGameSelected(memoController.mapIdMap[mapId].name, memoController.gameMap[gameId].name),
                    });
                });
            }
            case enums.ACT_GET_BATTLE_DETAIL: {
                const battleId = payload.battleId;
                return models.RecordWar.findOne({ where: {id: battleId}, attributes: {exclude:['createdAt', 'updatedAt']}}).then(w => {
                    subEmitMessage(act, w.toJSON());
                });
            }
            
            default:
                console.log("Not Found Act: ", act);
        }
        console.log('Be General Failed. [ ', userinfo.nickname, ' ] act: ', act, 'payload: ', payload);
        return subEmitMessage(enums.ALERT, {msg: 'Failed.', act}); 
    }

    function subEmitMessage(act, payload) {
        memoController.emitSocketByte(socket, enums.MESSAGE, {act, payload});
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


function broadcastSocket(memoctl, data) {
    return memoctl.broadcast(enums.MESSAGE, data);
}


async function updateMapOwner(mapId, countryId, userinfo, memoController=null) {
    await models.Map.update({
        ownCountryId: countryId,
    }, {where: { id: mapId }});
    if (memoController) {
        memoController.mapIdMap[mapId].ownCountryId = countryId;
        algorithms.updateHash(mapId, 'country', countryId);
    }
    await models.RecordApi.create({
        userId: userinfo.id,
        model: 'Map',
        payload: JSON.stringify({id: mapId, ownCountryId: countryId}),
        curd: 2,
    })
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
    if (data.winnerCountryId > 0) {
        broadcastSocket(memoController, {act: enums.ACT_BATTLE_DONE, payload: { mapId }});
    } else {
        const jsondata = memoController.battlefieldMap[mapId];
        broadcastSocket(memoController, {act: enums.ACT_BATTLE_ADD, payload: { mapId, jsondata }});
    }
    return true
}

async function updateSingleUser(id, update, userinfo, memoController) {
    const user = await models.User.update(update, {where: {id}});
    Object.keys(update).map(key => {
        memoController.userMap[id][key] = update[key];
    });
    broadcastSocket(memoController, {act: enums.ACT_GET_GLOBAL_CHANGE_DATA, payload: { dataset: [ { depth: ['users', id], update } ] }});
    memoController.userSockets.map(user => {
        if (user.socket) {
            memoController.emitSocketByte(user.socket,  enums.AUTHORIZE, {act: enums.AUTHORIZE, payload: update},);
        }
    });
    await models.RecordApi.create({
        userId: userinfo.id,
        model: 'User',
        payload: JSON.stringify({targetUserId: id, ...update}),
        curd: 2,
    });
    return user;
}

async function updateCity(id, update, userinfo, memoController) {
    const city = await models.City.update(update, {where: {id}});
    Object.keys(update).map(key => {
        memoController.cityMap[id][key] = update[key];
    });
    broadcastSocket(memoController, {act: enums.ACT_GET_GLOBAL_CHANGE_DATA, payload: { dataset: [ { depth: ['cities', id], update } ] }});
    await models.RecordApi.create({
        userId: userinfo.id,
        model: 'City',
        payload: JSON.stringify(update),
        curd: 2,
    });
    return city;
}

function getCityConstruction(mapId, name, memoController) {
    const map = memoController.mapIdMap[mapId];
    const city = map.cityId > 0 ? memoController.cityMap[map.cityId] : null;
    return city && city.jsonConstruction && city.jsonConstruction.hasOwnProperty(name) ? city.jsonConstruction[name] : {lv: 0, value: 0};
}

module.exports = onMessage