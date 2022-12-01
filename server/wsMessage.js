const enums = require('../src/enum');
const models = require('./models');
const algorithms = require('./websocketctl/algorithm');
const validation = require('./wsValidation');
const sequelize = require('sequelize');

function onMessage(socket, asyncUpdateUserInfo, memoController, configs) {
    
    socket.on(enums.MESSAGE, (msg) => {
        const act = msg.act || '';
        const payload = msg.payload || {};
        const userinfo = socket.request.session.userinfo;
        // console.log('before validated: payload: ', payload)
        const validated = validation.validate(act, payload, userinfo, memoController);
        if (!validated.ok) {
            return subEmitMessage(enums.ALERT, {msg: validated.msg, act}); 
        }
        let switched = subSwitchOnMessage(act, payload, userinfo);
        if (switched) {
            return switched.catch ? switched.catch(err => console.log('[Error] ', err)) : switched;
        } else {
            console.log('SubSwitchOnMessage Failed: ', switched)
            return switched;
        }
    });

    return true;


    function subSwitchOnMessage(act, payload, userinfo) {
        console.log('subSwitchOnMessage: act: ', act);
        switch (act) {
            case enums.ACT_GET_GLOBAL_USERS_INFO: {
                const actMaxIdx = enums.UserGlobalAttributes.indexOf('actPointMax');
                const users = algorithms.flatMap(memoController.userMap, enums.UserGlobalAttributes).filter(u => u[actMaxIdx] > 0);
                return subEmitMessage(act, {users});
            }
            case enums.ACT_MOVE: {
                const targetId = payload;
                const nowId = userinfo.mapNowId;
                const dis = algorithms.getMapDistance(nowId, targetId, userinfo.countryId);
                if (dis > 0 && dis <= userinfo.actPoint) {
                    const discount = getCityConstruction(nowId, 'stable', memoController).lv;
                    const spendPoint = Math.max(1, dis - discount);
                    return asyncUpdateUserInfo(userinfo, {mapNowId: targetId, actPoint: userinfo.actPoint - spendPoint}, act);
                } else {
                    console.log('[ACT_MOVE] Distance wrong: ', dis)
                }
            } break
            case enums.ACT_LEAVE_COUNTRY: {
                return asyncUpdateUserInfo(userinfo, { countryId: 0, role: enums.ROLE_FREEMAN, actPoint: 0, money: 0, soldier: 0, actPointMax: 3, occupationId: 0 }, act).then(e => {
                    return memoController.eventCtl.broadcastInfo(enums.EVENT_LEAVE_COUNTRY, {nickname: userinfo.nickname, round: configs.round.value});
                });
            }
            case enums.ACT_ENTER_COUNTRY: {
                const mapId = userinfo.mapNowId;
                const thisCountryId = memoController.mapIdMap[mapId].ownCountryId;
                const thisCountry = memoController.countryMap[thisCountryId];
                const ratio = Math.round(Math.random() * 10) / 10;
                console.log('[ACT_ENTER_COUNTRY]: ratio: ', ratio, ' nickname: ', userinfo.nickname);
                if (ratio >= 0.5) {
                    return asyncUpdateUserInfo(userinfo, { countryId: thisCountryId, role: enums.ROLE_GENERMAN, actPoint: 0, actPointMax: 7, loyalUserId: 0 }, act).then(e => {
                        return memoController.eventCtl.broadcastInfo(enums.EVENT_ENTER_COUNTRY, {nickname: userinfo.nickname, countryName: thisCountry.name, round: configs.round.value});
                    });
                } else {
                    return asyncUpdateUserInfo(userinfo, { actPoint: 0 }, act);
                }
            }
            case enums.ACT_SEARCH_WILD: {
                const randomMoney = Math.round(Math.random() * 100) + 50;
                const maxMoney = 150;
                const isLucky = randomMoney / maxMoney > 0.97;
                return memoController.businessCtl.search(userinfo.mapNowId).then((evt) => {
                    if (evt && evt.success) {
                        const thismap = memoController.mapIdMap[userinfo.mapNowId];
                        const itemSellerMap = memoController.businessCtl.getSellerMap();
                        memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                            round: configs.round.value,
                            countryId: userinfo.countryId,
                            type: '隱士',
                            content: `${userinfo.nickname} 在 ${thismap.name} 探索時發現了 ${evt.name}`,
                        });
                        broadcastSocket(memoController, {act: enums.ACT_GET_ITEM_SELLER, payload: {itemSellerMap}});
                    }

                    isLucky && memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                        round: configs.round.value,
                        countryId: userinfo.countryId,
                        type: enums.CHINESE_TYPE_DOMESTIC,
                        content: algorithms.getMsgLuckyMoney(userinfo.nickname, randomMoney),
                    });

                    return asyncUpdateUserInfo(userinfo, { money: userinfo.money + randomMoney, actPoint: userinfo.actPoint-1,  }, act, evt)
                });
            }
            case enums.ACT_BUSINESS: {
                const thisMap = memoController.mapIdMap[userinfo.mapNowId];
                const thisCity = memoController.cityMap[thisMap.cityId];
                const addMoney = thisCity.addResource;
                const randomMoney = Math.round(Math.random() * 100) + 50 + addMoney;
                const construction = getCityConstruction(userinfo.mapNowId, 'market', memoController);
                const additionalMoney = construction.lv * enums.NUM_ADDITIONAL_MARKET_MONEY;
                const maxMoney = 150 + addMoney + additionalMoney;
                const plus = Math.min(randomMoney + additionalMoney + construction.lv, maxMoney);
                const isLucky = plus / maxMoney > 0.97;
                return asyncUpdateUserInfo(userinfo, { money: userinfo.money + plus, actPoint: userinfo.actPoint-1 }, act).then(() => {
                    return isLucky && memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                        round: configs.round.value,
                        countryId: userinfo.countryId,
                        type: enums.CHINESE_TYPE_DOMESTIC,
                        content: algorithms.getMsgLuckyMoney(userinfo.nickname, plus, true),
                    });
                });
            }
            case enums.ACT_INCREASE_SOLDIER: {
                const construction = getCityConstruction(userinfo.mapNowId, 'barrack', memoController);
                const randomSoldier = algorithms.randomIncreaseSoldier(userinfo.countryId, construction.lv);
                const isLucky = randomSoldier.lucky;
                return asyncUpdateUserInfo(userinfo, { soldier: userinfo.soldier + randomSoldier.add, actPoint: userinfo.actPoint-1 }, act).then(() => {
                    return isLucky && memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                        round: configs.round.value,
                        countryId: userinfo.countryId,
                        type: enums.CHINESE_TYPE_DOMESTIC,
                        content: algorithms.getMsgLuckySoldier(userinfo.nickname, randomSoldier.add),
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

                const now = new Date();
                const nowMap = memoController.mapIdMap[userinfo.mapNowId];
                const nowTimeMinutes = Math.floor(now.getTime() / 1000 / 60);
                if (nowTimeMinutes < nowMap.adventureId) {
                    return subEmitMessage(enums.ALERT, {deadline: new Date(nowMap.adventureId*60*1000), map: nowMap.name, act});
                }
                if (noCountry || isFreeWild) { // empty or wild
                    return asyncUpdateUserInfo(userinfo, {
                        actPoint: userinfo.actPoint - enums.NUM_BATTLE_ACTION_MIN,
                        money: userinfo.money - enums.NUM_BATTLE_MONEY_MIN,
                        // soldier: userinfo.soldier - (noCountry ? enums.NUM_BATTLE_SOLDIER_MIN : 0),
                        soldier: userinfo.soldier - enums.NUM_BATTLE_SOLDIER_MIN,
                        mapNowId: mapId,
                        contribution: userinfo.contribution + enums.NUM_BATTLE_CONTRUBUTION,
                    }, act).then((user) => {
                        return updateMapOwner(mapId, userinfo.countryId , userinfo, memoController);
                    }).then(() => {
                        return memoController.eventCtl.broadcastInfo(enums.EVENT_WAR_WIN, {atkCountryName, mapName: thisMap.name, nicknames: userinfo.nickname, round: configs.round.value});
                    });
                }

                return models.RecordWar.findAll({
                    where: { winnerCountryId: 0, timestamp: { [sequelize.Op.gte]: new Date() } },
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
                        }, act).then(() => {
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
                        }, act) : null;
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
                        if (involvedSoldiers > 10000) { break }
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
                        }, act) : null;
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
                        }, act).then(() => {
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
                    }, act) : null;
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
                    }, act) : null;
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
                const itemId = payload.itemId;
                return updateSingleUser(userId, {soldier: targetUser.soldier + soldier, money: targetUser.money + money}, userinfo, memoController).then(e => {
                    
                    return e ? asyncUpdateUserInfo(userinfo, {
                        actPoint: userinfo.actPoint - 1,
                        soldier: userinfo.soldier - soldier,
                        money: userinfo.money - money,
                    }, act).then(() => {
                        if (itemId > 0) {
                            const pkItemIdx = memoController.userPacketItemMap[userinfo.id].findIndex(item => item.itemId == itemId && item.status == 1);
                            const pkItem = memoController.userPacketItemMap[userinfo.id][pkItemIdx]
                            if (memoController.userPacketItemMap[userId]) {
                                memoController.userPacketItemMap[userId].push(pkItem);
                            } else {
                                memoController.userPacketItemMap[userId] = [pkItem];
                            }
                            memoController.userPacketItemMap[userinfo.id].splice(pkItemIdx, 1);
                            subEmitMessage(enums.ACT_GET_ITEMS, memoController.userPacketItemMap[userinfo.id]);
                            return models.PacketItem.update({userId}, {where: {id: pkItem.id}});
                        }
                        return true
                    }).then(() => {
                        const item = memoController.itemMap[itemId];
                        return memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                            round: configs.round.value,
                            countryId: userinfo.countryId,
                            type: enums.CHINESE_TYPE_DOMESTIC,
                            content: algorithms.getMsgShare(userinfo.nickname, targetUser.nickname, money, soldier, item ? item.name : ''),
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
                return asyncUpdateUserInfo(userinfo, updateData, act).then(user => {
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
                    broadcastSocket(memoController, {act: enums.ACT_BATTLE_GAME_SELECTED, payload});
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
            case enums.ACT_RECRUIT: {
                const userId = payload.userId;
                const user = memoController.userMap[userId];
                const map = memoController.mapIdMap[user.mapNowId] || {};
                const inMyCountrySide = map.ownCountryId == userinfo.countryId;
                const successRatio = inMyCountrySide ? 2 : 1;
                const randomResult = Math.floor(Math.random() * 10);
                const success = randomResult <= successRatio;
                console.log(`[ACT_RECRUIT] successRatio: ${successRatio} randomResult: ${randomResult} / 10`);
                return asyncUpdateUserInfo(userinfo, { actPoint: userinfo.actPoint - 3 }, act, {success}).then(e => {
                    const round = configs.round.value;
                    const nickname = user.nickname;
                    if (success) {
                        const country = memoController.countryMap[userinfo.countryId];
                        const countryName = country.name;
                        const originCityMap = Object.values(memoController.mapIdMap).find(m => m.cityId == country.originCityId);
                        memoController.eventCtl.broadcastInfo(enums.EVENT_RECRUIT, {nickname, countryName, round});
                        return updateSingleUser(userId, {countryId: userinfo.countryId, role: enums.ROLE_GENERMAN , actPointMax: 7, captiveDate: null, mapNowId: originCityMap.id, mapTargetId: 0, occupationId: 0}, userinfo, memoController);
                    } else {
                        return memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                            round,
                            countryId: userinfo.countryId,
                            type: enums.CHINESE_TYPE_DOMESTIC,
                            content: algorithms.getMsgRecruitFail(userinfo.nickname, nickname),
                        });
                    }
                });
            }
            case enums.ACT_RECRUIT_CAPTIVE: {
                const userId = payload.userId;
                const user = memoController.userMap[userId];
                const nowDate = new Date();
                const captiveDate = new Date(user.captiveDate);
                const gapDays = Math.ceil((nowDate.getTime() - captiveDate.getTime()) / 1000 / 60 / 60 / 24);
                const basicLine = 25 + ((gapDays+1) * 2.5);
                const randomResult = Math.floor(Math.random() * 100);
                console.log(`[ACT_RECRUIT_CAPTIVE] basicLine: ${basicLine} randomResult: ${randomResult} / 100`);
                const success = randomResult <= basicLine;
                return asyncUpdateUserInfo(userinfo, { actPoint: userinfo.actPoint - 3 }, act, {success}).then(e => {
                    const round = configs.round.value;
                    const nickname = user.nickname;
                    if (success) {
                        const country = memoController.countryMap[userinfo.countryId];
                        const emperor = userinfo.nickname;
                        const originCityMap = Object.values(memoController.mapIdMap).find(m => m.cityId == country.originCityId);
                        memoController.eventCtl.broadcastInfo(enums.EVENT_CAPTIVE_RECRUIT, {nickname, emperor, round});
                        return updateSingleUser(userId, {countryId: userinfo.countryId, role: enums.ROLE_GENERMAN , actPointMax: 7, captiveDate: null, mapNowId: originCityMap.id, mapTargetId: 0, occupationId: 0, loyalUserId: 0}, userinfo, memoController);
                    } else {
                        const backCountry = memoController.countryMap[user.countryId];
                        const originCityMap = backCountry.originCityId > 0 ? Object.values(memoController.mapIdMap).find(m => m.cityId == backCountry.originCityId) : null;
                        if (originCityMap) {
                            memoController.eventCtl.broadcastInfo(enums.EVENT_CAPTIVE_ESCAPE, { round, nickname });
                            return updateSingleUser(userId, {captiveDate: null, mapNowId: originCityMap.id, mapTargetId: 0}, userinfo, memoController);
                        } else {
                            return memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                                round,
                                countryId: userinfo.countryId,
                                type: enums.CHINESE_TYPE_DOMESTIC,
                                content: algorithms.getMsgRecruitFail(userinfo.nickname, nickname, true),
                            });
                        }
                    }
                });
            }
            case enums.ACT_RELEASE_CAPTIVE: {
                const userId = payload.userId;
                const user = memoController.userMap[userId];
                const money = userinfo.money + user.money;
                const soldier = userinfo.soldier + user.soldier;
                return asyncUpdateUserInfo(userinfo, { actPoint: userinfo.actPoint - 1, money, soldier }, act).then(e => {
                    const round = configs.round.value;
                    const nickname = user.nickname;
                    const emperor = userinfo.nickname;
                    const backCountry = memoController.countryMap[user.countryId];
                    const maps = Object.values(memoController.mapIdMap);
                    const originCityMap = backCountry.originCityId > 0 ? maps.find(m => m.cityId == backCountry.originCityId) : null;
                    memoController.eventCtl.broadcastInfo(enums.EVENT_CAPTIVE_RELEASE, { round, nickname, emperor });
                    // 2022.09.12 因無主城 原先是從ID找 改成隨機
                    // const mapNowId = originCityMap ? originCityMap.id : maps.find(m => m.ownCountryId == user.countryId).id;
                    let mapNowId;
                    if (originCityMap) {
                        mapNowId = originCityMap.id;
                    } else {
                        const localMaps = maps.filter(m => m.ownCountryId == user.countryId);
                        mapNowId = localMaps.length > 0 ? localMaps[Math.floor(Math.random() * localMaps.length)].id : user.mapNowId;
                    }
                    return updateSingleUser(userId, {captiveDate: null, mapNowId, mapTargetId: 0, money: 0, soldier: 0}, userinfo, memoController);
                });
            }
            case enums.ACT_SET_ORIGIN_CITY: {
                const cityId = payload.cityId;
                const gameTypeId = payload.gameTypeId;
                return asyncUpdateUserInfo(userinfo, { actPoint: userinfo.actPoint - 1 }, act).then(e => {
                    const round = configs.round.value;
                    const countryName = memoController.countryMap[userinfo.countryId].name;
                    const map = Object.values(memoController.mapIdMap).find(m => m.cityId == cityId);
                    const mapName = map.name;
                    memoController.eventCtl.broadcastInfo(enums.EVENT_MIGRATE_MAIN_CITY, { round, countryName, mapName });
                    return updateOriginCity(cityId, map.id, gameTypeId, userinfo, memoController);
                });
            }
            case enums.ACT_RAISE_COUNTRY: {
                return createCountry(payload, userinfo, memoController).then((data) => {
                    const round = configs.round.value;
                    return memoController.eventCtl.broadcastInfo(enums.EVENT_GROUP_UP, { round, users: data.users, mapName: data.mapName });
                });
            }
            case enums.ACT_REBELLION: {
                return createCountry(payload, userinfo, memoController, false, true).then((data) => {
                    const round = configs.round.value;
                    // {nickname} 位於 {mapName} 叛亂 {whether}
                    return memoController.eventCtl.broadcastInfo(enums.EVENT_CHAOS, { round, nickname: userinfo.nickname, mapName: data.mapName, whether: `舉國為 ${data.countryName}` });
                });
            }
            case enums.ACT_GET_ITEMS: {
                const userId = userinfo.id;
                const items = memoController.userPacketItemMap[userId] || [];
                return subEmitMessage(act, items);
            }
            case enums.ACT_USE_ITEM: {
                const itemId = payload.itemId;
                const itemPkId = payload.itemPkId;
                const mapId = payload.mapId;
                return asyncSwitchItemFunctions(itemId, itemPkId, mapId, userinfo, memoController).then(data => {
                    console.log('asyncSwitchItemFunctions data: ', data);
                    const round = configs.round.value;
                    if (data.done) {
                        return memoController.eventCtl.broadcastInfo(enums.EVENT_USE_TIPS, { round, nickname: data.nickname, tips: data.tips });
                    } else {
                        return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
                    }
                });
            }
            case enums.ACT_BUY_ITEM: {
                const itemId = payload.itemId;
                const item = memoController.itemMap[itemId];
                return memoController.businessCtl.buy(item.name, userinfo).then(newItem => {
                    // console.log('newItem: ', newItem)
                    if (newItem) {
                        const pkItem = {
                            id: newItem.id,
                            itemId: newItem.itemId,
                            status: newItem.status,
                            userId: newItem.userId,
                            userTarget: newItem.userTarget,
                        }
                        if (memoController.userPacketItemMap[userinfo.id] && memoController.userPacketItemMap[userinfo.id].length >= 0) {
                            memoController.userPacketItemMap[userinfo.id].push(pkItem);
                        } else {
                            memoController.userPacketItemMap[userinfo.id] = [pkItem];
                        }
                        return asyncUpdateUserInfo(userinfo, { actPoint: userinfo.actPoint - 1, money: userinfo.money - newItem.price }, act).then(() => {
                            memoController.eventCtl.broadcastInfo(enums.EVENT_DOMESTIC, {
                                round: configs.round.value,
                                countryId: userinfo.countryId,
                                type: '交易',
                                content: `${userinfo.nickname} 獲得了錦囊 [${item.name}] `,
                            });
                            return subEmitMessage(enums.ACT_GET_ITEMS, memoController.userPacketItemMap[userinfo.id]);
                        });
                        
                    } else {
                        return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
                    }
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
    const now = new Date();
    now.setDate(now.getDate() + 1);
    const timeMinutes = Math.floor(now.getTime() / 1000 / 60);
    const thismap = memoController.mapIdMap[mapId];
    const loseCountryId = thismap.ownCountryId;
    const cityId = thismap.cityId;
    await models.Map.update({
        ownCountryId: countryId,
        adventureId: timeMinutes,
    }, {where: { id: mapId }});
    if (memoController) {
        memoController.mapIdMap[mapId].ownCountryId = countryId;
        memoController.mapIdMap[mapId].adventureId = timeMinutes;
        algorithms.updateHash(mapId, 'country', countryId);
        broadcastSocket(memoController, {act: enums.ACT_GET_GLOBAL_CHANGE_DATA, payload: {dataset: [{depth: ['maps', mapId], update: {adventureId: timeMinutes, ownCountryId: countryId}}]}});
        
        const thisBattle = memoController.battlefieldMap[mapId];
        if (thisBattle) {
            let atkUsers = thisBattle.atkUserIds.filter(uid => uid > 0);
            let defUsers = thisBattle.defUserIds.filter(uid => uid > 0);
            let inBattleUsers = atkUsers.concat(defUsers);
            await models.RecordWar.update({winnerCountryId: 999}, {where: {id: thisBattle.id}});
            delete memoController.battlefieldMap[mapId];
            broadcastSocket(memoController, {act: enums.ACT_BATTLE_DONE, payload: {mapId, id: thisBattle.id}});
            for (let i = 0; i < inBattleUsers.length; i++) {
                let userId = inBattleUsers[i];
                await updateSingleUser(userId, {mapTargetId: 0}, userinfo, memoController);
            }
        }

        const countryDestoried = Object.values(memoController.mapIdMap).filter(m => m.ownCountryId == loseCountryId).length == 0;

        if (countryDestoried) {

            const globalChangeDataset = [];
            const defCountryName = memoController.countryMap[loseCountryId].name;
            const atkCountryName = memoController.countryMap[countryId].name;

            const updatedUsers = await memoController.battleCtl.handleDestoried(countryId, loseCountryId);
            
            globalChangeDataset.push({ depth: ['countries', loseCountryId], update: {emperorId: 0, originCityId: 0} });
            memoController.countryMap[loseCountryId].emperorId = 0;
            memoController.countryMap[loseCountryId].originCityId = 0;

            updatedUsers && updatedUsers.map(usr => {
                const updateKeys = Object.keys(usr.updated);
                updateKeys.map(k => {
                    memoController.userMap[usr.id][k] = usr.updated[k];
                });
                globalChangeDataset.push({ depth: ['users', usr.id], update: usr.updated });
                memoController.userSockets.map(us => {
                    if (us.id == usr.id) {
                        updateKeys.map(k => {
                            us.userinfo[k] = usr.updated[k];
                        });
                        memoController.emitSocketByte(us.socket, enums.AUTHORIZE, {act: enums.AUTHORIZE, payload: usr.updated});
                    }
                });
            });

            const destoriedBattles = Object.values(memoController.battlefieldMap).filter(e => e.attackCountryIds[0] == loseCountryId);
            if (destoriedBattles.length > 0) {
                for (let i = 0; i < destoriedBattles.length; i++) {
                    const _battle = destoriedBattles[i];
                    const _mapId = _battle.mapId;
                    delete memoController.battlefieldMap[_mapId];
                    broadcastSocket(memoController, {act: enums.ACT_BATTLE_DONE, payload: {
                        id: _battle.id,
                        timestamp: _battle.timestamp,
                        mapId: _mapId,
                        winnerCountryId: countryId,
                        attackCountryIds: _battle.attackCountryIds,
                        defenceCountryId: _battle.defenceCountryId
                    }});
                }
            }

            memoController.eventCtl.broadcastInfo(enums.EVENT_DESTROY_COUNTRY, {
                round: 0,
                defCountryName,
                atkCountryName,
            });

            broadcastSocket(memoController, {act: enums.ACT_GET_GLOBAL_CHANGE_DATA, payload: {dataset: globalChangeDataset}});
        } else if (cityId) {
            const country = await models.Country.findByPk(loseCountryId);
            if (country.originCityId == cityId) {
                country.originCityId = 0;
                await country.save();
                memoController.countryMap[loseCountryId].originCityId = 0;
            }
            broadcastSocket(memoController, {act: enums.ACT_GET_GLOBAL_CHANGE_DATA, payload: {dataset: [{ depth: ['countries', loseCountryId], update: {originCityId: 0} }]}});
        }
    }
    await models.RecordApi.create({
        userId: userinfo.id,
        model: 'Map',
        payload: JSON.stringify({id: mapId, ownCountryId: countryId}),
        curd: 2,
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
    const updateKeys = Object.keys(update);
    updateKeys.map(key => {
        memoController.userMap[id][key] = update[key];
    });
    broadcastSocket(memoController, {act: enums.ACT_GET_GLOBAL_CHANGE_DATA, payload: { dataset: [ { depth: ['users', id], update } ] }});
    memoController.userSockets.map(user => {
        if (user.id == id) {
            if (user.socket) {
                memoController.emitSocketByte(user.socket,  enums.AUTHORIZE, {act: enums.AUTHORIZE, payload: update},);
            }
            if (user.userinfo) {
                updateKeys.map(key => {
                    user.userinfo[key] = update[key];
                });
            }
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

async function updateOriginCity(originCityId, mapId, gameType, userinfo, memoController) {
    await models.Country.update({originCityId}, {where: {id: userinfo.countryId}});
    await models.Map.update({gameType}, {where: {id: mapId}});
    memoController.countryMap[userinfo.countryId].originCityId = originCityId;
    memoController.mapIdMap[mapId].gameType = gameType;
    const dataset = [
        { depth: ['countries', userinfo.countryId], update: {originCityId} },
        { depth: ['maps', mapId], update: {gameType} },
    ];
    broadcastSocket(memoController, {act: enums.ACT_GET_GLOBAL_CHANGE_DATA, payload: { dataset }});
    await models.RecordApi.create({
        userId: userinfo.id,
        model: 'Country',
        payload: JSON.stringify({originCityId}),
        curd: 2,
    });
    return true;
}

function getCityConstruction(mapId, name, memoController) {
    const map = memoController.mapIdMap[mapId];
    const city = map.cityId > 0 ? memoController.cityMap[map.cityId] : null;
    return city && city.jsonConstruction && city.jsonConstruction.hasOwnProperty(name) ? city.jsonConstruction[name] : {lv: 0, value: 0};
}

async function createCountry(payload, userinfo, memoController, hireFreeman = true, hireGenerals = false) {
    const countryName = payload.countryName;
    const gameTypeId = payload.gameTypeId;
    const colorBg = payload.colorBg;
    const colorText = payload.colorText;
    const thisMap = memoController.mapIdMap[userinfo.mapNowId];
    console.log('createCountry: ', countryName, colorBg);
    const newCountry = await models.Country.create({
        id: Object.keys(memoController.countryMap).length + 1,
        name: countryName,
        sign: countryName,
        money: 1,
        emperorId: userinfo.id,
        peopleMax: 15,
        color: `${colorBg},${colorText}`,
        originCityId: thisMap.cityId,
    });
    const jsonCountry = newCountry.toJSON();
    memoController.countryMap[jsonCountry.id] = jsonCountry;
    console.log('jsonCountry: ', jsonCountry);
    
    await models.Map.update({
        gameType: gameTypeId,
        ownCountryId: jsonCountry.id,
    },{where: {id: thisMap.id}});
    memoController.mapIdMap[thisMap.id].gameType = gameTypeId;
    memoController.mapIdMap[thisMap.id].ownCountryId = jsonCountry.id;
    await updateMapOwner(thisMap.id, jsonCountry.id, userinfo, memoController)
    // algorithms.updateHash(thisMap.id, 'country', jsonCountry.id);
    let users = `${userinfo.nickname}`;
    if (hireFreeman) {
        const freeusers = Object.values(memoController.userMap).filter(user => user.mapNowId == thisMap.id && user.role == enums.ROLE_FREEMAN);
        for (let i = 0; i < freeusers.length; i++) {
            let user = freeusers[i];
            let ismydo = user.id == userinfo.id;
            await updateSingleUser(user.id, {
                countryId: jsonCountry.id,
                role: ismydo ? enums.ROLE_EMPEROR : enums.ROLE_GENERMAN,
                actPointMax: ismydo ? 10 : 7,
                occupationId: 0,
                loyalUserId: ismydo ? 0 : userinfo.id
            }, userinfo, memoController);
            if (user.id != userinfo.id) {
                users += `,${user.nickname}`;
            }
        }
    } else {
        const generals = hireGenerals ? 
            Object.values(memoController.userMap).filter(user => user.mapNowId == thisMap.id && user.role == enums.ROLE_GENERMAN && !user.captiveDate)
        :   [memoController.userMap[userinfo.id]];

        for (let i = 0; i < generals.length; i++) {
            let user = generals[i];
            let ismydo = user.id == userinfo.id;
            await updateSingleUser(user.id, {
                countryId: jsonCountry.id,
                role: ismydo ? enums.ROLE_EMPEROR : enums.ROLE_GENERMAN,
                actPoint: ismydo ? 15 : 7,
                actPointMax: ismydo ? 10 : 7,
                occupationId: 0,
                loyalUserId: 0,
                mapNextId: Math.floor(new Date().getTime() / 1000 / 60),    // save minutes for now
            }, userinfo, memoController);
            if (!ismydo) {
                users += `,${user.nickname}`;
            }
        }
    }
    
    broadcastSocket(memoController, {act: enums.ACT_RAISE_COUNTRY, payload: {newCountry: jsonCountry, mapId: thisMap.id, gameType: gameTypeId}});

    await models.RecordApi.create({
        userId: userinfo.id,
        model: 'Country',
        payload: JSON.stringify(jsonCountry),
        curd: 1,
    });
    return {users, mapName: thisMap.name, countryName};
}

async function asyncSwitchItemFunctions(itemId, itemPkId, mapId, userinfo, memo) {
    const itemInfo = memo.itemMap[itemId];
    const results = {done: false, nickname: userinfo.nickname, tips: ''};
    const effUserNames = [];
    const effMapNames = [];
    let mapName = (mapId > 0 ? memo.mapIdMap[mapId] : memo.mapIdMap[userinfo.mapNowId]).name;
    let appendTips = '';
    switch (itemInfo.staticKey) {
        case '_STRATEGY_RECRUIT_': {
            const users = Object.values(memo.userMap).filter(user => user.mapNowId == mapId && user.role == enums.ROLE_FREEMAN);
            for (let i = 0; i < users.length; i++) {
                let user = users[i];
                effUserNames.push(user.nickname);
                await updateSingleUser(user.id, {
                    countryId: userinfo.countryId,
                    role: enums.ROLE_GENERMAN,
                    actPointMax: 7,
                    captiveDate: null,
                    mapNowId: userinfo.mapNowId,
                    mapTargetId: 0,
                    occupationId: 0,
                    loyalUserId: 0
                }, userinfo, memo);
            }
        } break;
        case '_STRATEGY_MOVE_': {
            effMapNames.push(mapName);
            await updateSingleUser(userinfo.id, {
                captiveDate: null,
                mapNowId: mapId,
                mapTargetId: 0
            }, userinfo, memo);
        } break;
        case '_STRATEGY_CATCH_': {
            const mycountryId = userinfo.countryId;
            const users = Object.values(memo.userMap).filter(user => user.mapNowId == mapId && user.mapTargetId == 0 && user.countryId != mycountryId && user.role == enums.ROLE_GENERMAN);
            if (users.length > 0) {
                users.sort((a,b) => a.contribution - b.contribution);
                let user = users[0];
                effUserNames.push(user.nickname);
                await updateSingleUser(user.id, {
                    captiveDate: new Date(),
                    mapNowId: userinfo.mapNowId
                }, userinfo, memo);
            }
        } break;
        case '_STRATEGY_ADD_RESOURCE_': {
            const mymapid = userinfo.mapNowId;
            const cityId = memo.mapIdMap[mymapid].cityId;
            const thisCity = memo.cityMap[cityId];
            if (thisCity) {
                await updateCity(cityId, { addResource: thisCity.addResource + 15}, userinfo, memo);
                effMapNames.push(mapName);
            }
        } break;
        case '_STRATEGY_BUILDING_UP_': {
            const mapid = userinfo.mapNowId;
            const cityId = memo.mapIdMap[mapid].cityId;
            const thisCity = memo.cityMap[cityId];
            if (thisCity) {
                const update = {
                    jsonConstruction: {...thisCity.jsonConstruction}
                };
                Object.keys(update.jsonConstruction).map(key => {
                    update.jsonConstruction[key].lv += 1;
                });
                await updateCity(cityId, update, userinfo, memo);
                effMapNames.push(mapName);
            }
        } break;
        case '_STRATEGY_STEAL_': {
            const users = Object.values(memo.userMap).filter(u => u.mapNowId == mapId && u.role == enums.ROLE_GENERMAN && u.id != userinfo.id);
            if (users.length > 0) {
                const rand = Math.floor(Math.random() * users.length);
                const targetUser = users[rand];
                const hisItems = memo.userPacketItemMap[targetUser.id];
                effUserNames.push(targetUser.nickname);
                if (hisItems) {
                    const itemMap = memo.itemMap;
                    const itemNameMap = {};
                    hisItems.map(i => {
                        let itemName = itemMap[i.itemId].name;
                        itemNameMap[itemName] = true;
                    });
                    appendTips = ` 獲得 (${Object.keys(itemNameMap).join(',')})`;
                    await models.PacketItem.update({userId: userinfo.id}, {where: {userId: targetUser.id}});
                    memo.userPacketItemMap[userinfo.id] = memo.userPacketItemMap[userinfo.id].concat(hisItems);
                    memo.userPacketItemMap[targetUser.id] = [];
                } else {
                    appendTips = '(無獲得任何錦囊)';
                }
            }
        } break;
        case '_STRATEGY_REDUCE_GOLD_': {
            const users = Object.values(memo.userMap).filter(u => u.mapNowId == mapId && u.countryId != userinfo.countryId && u.role == enums.ROLE_GENERMAN);
            if (users.length > 0) {
                const targetCountryId = memo.mapIdMap[mapId].ownCountryId;
                const decreaseRatio = Math.min(Object.values(memo.mapIdMap).filter(m => m.ownCountryId == targetCountryId).length * 2 /100, 1);
                for (let i = 0; i < users.length; i++) {
                    let user = users[i];
                    let money = Math.floor(user.money * (1-decreaseRatio));
                    await updateSingleUser(user.id, {money}, userinfo, memo);
                    effUserNames.push(user.nickname);
                }
                appendTips = ` (黃金減少率: ${decreaseRatio*100}%)`;
            }
        } break;
        case '_STRATEGY_FIRE_': {
            const thisMap = memo.mapIdMap[mapId];
            const thisCity = memo.cityMap[thisMap.cityId];
            if (thisCity) {
                const jsonConstruction = {...thisCity.jsonConstruction};
                jsonConstruction['wall'].lv = Math.ceil(jsonConstruction['wall'].lv / 2);
                await updateCity(thisCity.id, {jsonConstruction}, userinfo, memo);
                const firedMaps = [mapId].concat(thisMap.route);
                const now = new Date();
                now.setDate(now.getDate() + 7);
                const timeMinutes = Math.floor(now.getTime() / 1000 / 60);
                const dataset = [];
                await models.Map.update({
                    adventureId: timeMinutes,
                }, {where: { id: {[sequelize.Op.in]: firedMaps} }});
                firedMaps.map(mid => {
                    memo.mapIdMap[mid].adventureId = timeMinutes;
                    effMapNames.push(memo.mapIdMap[mid].name);
                    dataset.push({depth: ['maps', mid], update: {adventureId: timeMinutes}});
                });
                broadcastSocket(memo, {act: enums.ACT_GET_GLOBAL_CHANGE_DATA, payload: {dataset}});
            }
        } break;
        case '_STRATEGY_FIRE_STEAL_': {
            const thisMap = memo.mapIdMap[mapId];
            const timeMinutes = Math.floor(new Date().getTime() / 1000 / 60);
            if (thisMap.adventureId > timeMinutes) {
                const mycountryId = userinfo.countryId;
                const users = Object.values(memo.userMap).filter(u => u.mapNowId == mapId && u.countryId != mycountryId && u.role == enums.ROLE_GENERMAN);
                let totalMoney = 0;
                for (let i = 0; i < users.length; i++) {
                    let user = users[i];
                    totalMoney += user.money;
                    await updateSingleUser(user.id, {money: 0}, userinfo, memo);
                    effUserNames.push(user.nickname);
                }
                if (totalMoney > 0) {
                    appendTips = `(共獲得${totalMoney}黃金)`;
                    await updateSingleUser(userinfo.id, {money: userinfo.money + totalMoney}, userinfo, memo);
                }
            }
        } break;
        case '_STRATEGY_KICK_': {
            const targetMap = memo.mapIdMap[mapId];
            const users = Object.values(memo.userMap).filter(u => u.mapNowId == mapId && u.countryId == targetMap.ownCountryId && u.mapTargetId == 0 && u.role == enums.ROLE_GENERMAN);
            if (users.length > 0) {
                const allOtherMap = Object.values(memo.mapIdMap).filter(m => m.ownCountryId == targetMap.ownCountryId && m.id != targetMap.id);
                if (allOtherMap.length > 0) {
                    for (let i = 0; i < users.length; i++) {
                        let user = users[i];
                        let rand = Math.floor(Math.random() * allOtherMap.length);
                        let randMap = allOtherMap[rand];
                        await updateSingleUser(user.id, {mapNowId: randMap.id}, userinfo, memo);
                        effUserNames.push(user.nickname);
                    }
                }
            }
        } break;
        case '_STRATEGY_EAST_WEST_': {
            const targetMap = memo.mapIdMap[mapId];
            const users = Object.values(memo.userMap).filter(u => targetMap.route.includes(u.mapNowId) && u.countryId == targetMap.ownCountryId && u.role == enums.ROLE_GENERMAN);
            if (users.length > 0) {
                for (let i = 0; i < users.length; i++) {
                    let user = users[i];
                    await updateSingleUser(user.id, {mapNowId:  user.mapTargetId == 0 ? mapId : user.mapNowId, actPoint: Math.max(user.actPoint - 1, 0)}, userinfo, memo);
                    effUserNames.push(user.nickname);
                }
            }
        } break;
        case '_STRATEGY_SNEAK_': {
            const targetMap = memo.mapIdMap[mapId];
            const users = Object.values(memo.userMap).filter(u => u.mapNowId == mapId && u.countryId == targetMap.ownCountryId);
            if (users.length == 0 && targetMap.cityId == 0) {
                await updateMapOwner(mapId, userinfo.countryId, userinfo, memo);
                await updateSingleUser(userinfo.id, { mapNowId: mapId }, userinfo, memo);
                effMapNames.push(targetMap.name);
            }
        } break;
        case '_STRATEGY_SEIZE_': {
            const targetMap = memo.mapIdMap[mapId];
            const users = Object.values(memo.userMap).filter(u => u.mapNowId == mapId && u.countryId == targetMap.ownCountryId);
            if (users.length == 0 && targetMap.cityId > 0) {
                await updateMapOwner(mapId, userinfo.countryId, userinfo, memo);
                await updateSingleUser(userinfo.id, { mapNowId: mapId }, userinfo, memo);
                if (targetMap.ownCountryId > 0 && memo.countryMap[targetMap.ownCountryId]) {
                    const country = memo.countryMap[targetMap.ownCountryId];
                    const originCityId = country.originCityId;
                    if (originCityId == targetMap.cityId) {
                        await models.Country.update({
                            originCityId: 0,
                        }, {where: {id: country.id}});
                        country.originCityId = 0;
                    }
                }
                effMapNames.push(targetMap.name);
            }
        } break;
        case '_STRATEGY_TRAPE_': {
            const targetMap = memo.mapIdMap[mapId];
            const sameCountryMapIds = targetMap.route.filter(r => memo.mapIdMap[r].ownCountryId == targetMap.ownCountryId).concat(mapId);
            const users = Object.values(memo.userMap).filter(u => sameCountryMapIds.includes(u.mapNowId) && u.countryId == targetMap.ownCountryId && u.role == enums.ROLE_GENERMAN);
            if (users.length > 0) {
                for (let i = 0; i < users.length; i++) {
                    let user = users[i];
                    await updateSingleUser(user.id, {mapNowId: user.mapTargetId == 0 ? mapId : user.mapNowId, actPoint: 0}, userinfo, memo);
                    effUserNames.push(user.nickname);
                }
            }
        } break;
        case '_STRATEGY_EMPTY_CITY_': {
            const targetMapId = userinfo.mapNowId;
            const targetBattle = memo.battlefieldMap[targetMapId];
            if (targetBattle) {
                const users = targetBattle.atkUserIds.filter(uid => uid > 0).map(uid => memo.userMap[uid]);
                const defUsers = targetBattle.defUserIds.filter(uid => uid > 0);
                const now = new Date();
                if (users.length > 0 && defUsers.length == 0 && now.getTime() < new Date(targetBattle.timestamp).getTime()) {
                    const atkCountry = memo.countryMap[users[0].countryId];
                    const originMap = Object.values(memo.mapIdMap).find(m => m.cityId == atkCountry.originCityId);
                    for (let i = 0; i < users.length; i++) {
                        let user = users[i];
                        let mapNowId = originMap ? originMap.id : user.mapNowId;
                        await updateSingleUser(user.id, {mapNowId, mapTargetId: 0}, userinfo, memo);
                        effUserNames.push(user.nickname);
                    }

                    await models.RecordWar.update({winnerCountryId: 999}, {where: {id: targetBattle.id}});
                    delete memo.battlefieldMap[targetMapId];
                    broadcastSocket(memo, {act: enums.ACT_BATTLE_DONE, payload: {mapId: targetMapId, id: targetBattle.id}});
                }
            }
        } break;
        case '_STRATEGY_BEAUTY_': {
            const targetMapId = userinfo.mapNowId;
            const targetMap = memo.mapIdMap[targetMapId];
            const gapHours = 1000*60*60*24;
            const now = new Date();
            if (targetMap && targetMap.route) {
                const mapIds = [targetMapId].concat(targetMap.route);
                const battleMapInRange = [];
                for (let i = 0; i < mapIds.length; i++) {
                    let mid = mapIds[i];
                    let battle = memo.battlefieldMap[mid];
                    if (battle && (now.getTime() + gapHours) < new Date(battle.timestamp).getTime()) {
                        battleMapInRange.push(mid);
                    }
                }
                if (battleMapInRange.length > 0) {
                    let randIdx = Math.floor(Math.random() * battleMapInRange.length);
                    let randMapId = battleMapInRange[randIdx];
                    let battle = memo.battlefieldMap[randMapId];
                    let atkUsers = battle.atkUserIds.filter(uid => uid > 0);
                    let defUsers = battle.defUserIds.filter(uid => uid > 0);
                    let inBattleUsers = atkUsers.concat(defUsers);
                    await models.RecordWar.update({winnerCountryId: 999}, {where: {id: battle.id}});
                    delete memo.battlefieldMap[randMapId];
                    broadcastSocket(memo, {act: enums.ACT_BATTLE_DONE, payload: {mapId: randMapId, id: battle.id}});
                    for (let i = 0; i < inBattleUsers.length; i++) {
                        let userId = inBattleUsers[i];
                        let user = memo.userMap[userId];
                        await updateSingleUser(userId, {mapTargetId: 0}, userinfo, memo);
                        effUserNames.push(user.nickname);
                    }
                    mapName = memo.mapIdMap[randMapId].name;
                }
                
            }
        } break;
        case '_STRATEGY_BITTER_': {
            const decreaseSoldier = userinfo.soldier;
            const nearMaps = memo.mapIdMap[userinfo.mapNowId].route.concat(userinfo.mapNowId);
            const users = Object.values(memo.userMap).filter(u => nearMaps.includes(u.mapNowId) && u.countryId != userinfo.countryId && u.mapTargetId == 0 && u.role == enums.ROLE_GENERMAN);
            if (decreaseSoldier > 0 && users.length > 0) {
                for (let i = 0; i < users.length; i++) {
                    let user = users[i];
                    await updateSingleUser(user.id, {soldier: Math.max(user.soldier - decreaseSoldier, 0)}, userinfo, memo);
                    effUserNames.push(user.nickname);
                }
                await updateSingleUser(userinfo.id, {soldier: 0}, userinfo, memo);
                appendTips = `(所有人失去 ${decreaseSoldier} 兵力)`;
            }
        } break;
        case '_STRATEGY_SOLDIER_STEAL_': {
            const nearMaps = memo.mapIdMap[userinfo.mapNowId].route.concat(userinfo.mapNowId);
            const users = Object.values(memo.userMap).filter(u => nearMaps.includes(u.mapNowId) && u.countryId != userinfo.countryId && u.mapTargetId == 0 && u.soldier > 0 && u.role == enums.ROLE_GENERMAN);
            if (users.length > 0) {
                users.sort((a,b) => b.soldier - a.soldier);
                const mostSoldierUser = users[Math.floor(Math.random() * (users.length-1))];
                const halfSoldier = Math.floor(mostSoldierUser.soldier / 2);
                await updateSingleUser(userinfo.id, {soldier: userinfo.soldier + halfSoldier}, userinfo, memo);
                await updateSingleUser(mostSoldierUser.id, {soldier: mostSoldierUser.soldier - halfSoldier}, userinfo, memo);
                effUserNames.push(mostSoldierUser.nickname);
                mapName = memo.mapIdMap[mostSoldierUser.mapNowId].name;
                appendTips = `(共獲得 ${halfSoldier} 兵力)`;
            }
        } break;
        case '_STRATEGY_AVERAGE_': {
            const timeMinutes = Math.floor(new Date().getTime() / 1000 / 60);
            const nearMaps = [userinfo.mapNowId].concat(memo.mapIdMap[userinfo.mapNowId].route).filter(mid => memo.mapIdMap[mid].adventureId > timeMinutes);
            if (nearMaps.length > 0) {
                const users = Object.values(memo.userMap).filter(u => nearMaps.includes(u.mapNowId) && u.mapTargetId == 0 && u.role == enums.ROLE_GENERMAN);
                if (users.length > 1) {
                    const sumOfSoldier = users.reduce((a,b) => a + b.soldier, 0);
                    const avgSoldier = Math.floor(sumOfSoldier / users.length);
                    for (let i = 0; i < users.length; i++) {
                        let user = users[i];
                        await updateSingleUser(user.id, {soldier: avgSoldier}, userinfo, memo);
                        effUserNames.push(user.nickname);
                    }
                    appendTips = `(平均兵力為 ${avgSoldier})`;
                }
            }
        } break;
        default:
            return results;
    }

    if (effMapNames.length > 0) {
        results.tips = `(${itemInfo.name}) 對 (${effMapNames.join(',')})`;
        results.done = true;
    } else if (effUserNames.length > 0) {
        results.tips = `(${itemInfo.name}) 對 (${mapName}) 影響了 (${effUserNames.join(',')})`;
        results.done = true;
    } else if (itemInfo.name) {
        results.tips = `(${itemInfo.name}) 對 (${mapName}) 無有效目標受到影響`;
        results.done = true;
    } else {
        results.done = false;
    }

    results.tips += appendTips;

    if (results.done) {
        await models.PacketItem.update({status: 0, timestampUse: new Date(), userTarget: mapName}, {where: {id: itemPkId}});
        let pkidx = memo.userPacketItemMap[userinfo.id].findIndex(e => e.id == itemPkId);
        memo.userPacketItemMap[userinfo.id].splice(pkidx, 1);
        await updateSingleUser(userinfo.id, {actPoint: userinfo.actPoint - 1}, userinfo, memo);
    }
    return results;
}

module.exports = onMessage