const models = require('./models');
const { Op } = require("sequelize");
const enums = require('../src/enum');
const halfHourTimer = {
    timer: 0,
    binds: [],
    numHalfHour: 30
};
const memo = {webSocket: {}, userSockets: {}, map: {}};
const formulaRatio = {
    ATKWIN: (x, y) => (Math.min(y/x, 1)**2),
    ATKLOSE: (x, y) => (Math.min(y/x*0.5, 1)),
    DEFWIN: () => 0.20,
    DEFLOSE: () => 0.45,
}


function init(webSocket, userSockets, map) {
    memo.webSocket = webSocket;
    memo.userSockets = userSockets;
    memo.map = map;
    const waitMinutes = (60 - new Date().getMinutes()) % halfHourTimer.numHalfHour;
    console.log('[Batllefields] waitMinutes: ', waitMinutes);
    refresBattlefields();
    setTimeout(() => {
        halfHourTimer.timer = setInterval(refresBattlefields, 1000 * 60 * halfHourTimer.numHalfHour);
    }, waitMinutes * 60 * 1000);
    return this;
}


function bindSuccessfulRBF(fn) {
    halfHourTimer.binds.push(fn);
}


function refresBattlefields() {
    const isTest = false;
    const now = new Date();
    console.log('[RefresBattlefields] : ', now.toLocaleTimeString(), ' now hour: ', now.getHours());
    const hours = [8, 12, 13, 15, 16, 21, 22, 23];
    const isInHour = hours.includes(now.getHours());
    // console.log('maps: ', Object.values(memo.map).map(m => [m.id, m.ownCountryId]).filter(e => e[1] == 8));
    if (isInHour || isTest) {
        const prepareTimestamp = now.setDate(now.getDate() +(isTest ? 10 : 3));
        models.RecordWar.findAll({where: { winnerCountryId: 0, timestamp: {[Op.lte]: prepareTimestamp} }}).then(wars => {
            return wars.map(war => {
                let sumDefSoldier = war.detail.defSoldiers.reduce((a,b) => a+b, 0);
                let sumAtkSoldier = war.detail.atkSoldiers.reduce((a,b) => a+b, 0);
                if (sumDefSoldier > sumAtkSoldier) {
                    return handleWarWinner(war, false);
                } else if ( sumDefSoldier == 0) {
                    return handleWarWinner(war, true);
                } else {
                    return handleWarLock(war);
                }
            }).filter(e => !!e);
        }).then(e => {
            Promise.all(e).then(res => {
                res.length > 0 && halfHourTimer.binds.map(fn => fn.apply(null, [res.filter(r => !!r), now]));
            });
        }).catch(err => {
            console.log('err: ', err);
        });
    }
}

async function handleWarWinner(warModel, isAttackerWin = true, autoApply = false) {
    // const globalChangeDataset = [{ depth: ['users', userinfo.id], update }];
    const updated = {RecordWar: [], User: [], Country: []};
    const detail = warModel.detail;
    const atkUserIds = warModel.atkUserIds;
    const defUserIds = warModel.defUserIds;
    const sumAtkSoldier = detail.atkSoldiers.reduce((a,b) => a+b, 0);
    const sumDefSoldier = detail.defSoldiers.reduce((a,b) => a+b, 0);
    let atkSoldierRatio, defSoldierRatio, isDestoried;
    try {
        // 勝負 與 攻守方損兵
        if (isAttackerWin) {
            warModel.winnerCountryId = warModel.attackCountryIds[0];
            atkSoldierRatio = formulaRatio.ATKWIN(sumAtkSoldier, sumDefSoldier);
            defSoldierRatio = formulaRatio.DEFLOSE();
            isDestoried = Object.keys(memo.map).filter(mk => memo.map[mk].ownCountryId == warModel.defenceCountryId).length <= 1;
        } else {
            warModel.winnerCountryId = warModel.defenceCountryId;
            atkSoldierRatio = formulaRatio.ATKLOSE(sumAtkSoldier, sumDefSoldier);
            defSoldierRatio = formulaRatio.DEFWIN();
            isDestoried = false;
        }
        // 防守城池城牆抵禦率
        let finalDiscountRatio = 1;
        const map = await models.Map.findOne({where: {id: warModel.mapId}});
        const city = map.cityId > 0 ? await models.City.findOne({where: {id: map.cityId}}) : null;
        if (city) {
            const _city = city.toJSON();
            if (_city.jsonConstruction) {
                const jsonConstruction = JSON.parse(_city.jsonConstruction);
                if (jsonConstruction.wall && jsonConstruction.wall.hasOwnProperty('lv')) {
                    finalDiscountRatio = Math.max(1 - ((jsonConstruction.wall.lv * enums.NUM_ADDITIONAL_WALL_DISCOUNT_DAMAGE_RATIO) / 100), 0);
                }
            }
        }
        detail.finalDiscountRatio = finalDiscountRatio;
        detail.atkSoldierRatio = atkSoldierRatio;
        detail.defSoldierRatio = defSoldierRatio;

        // 發生滅國
        if (isDestoried) {

            updated.User = handleDestoried(warModel.winnerCountryId, warModel.defenceCountryId, atkUserIds, warModel.mapId);
            
        } else {
            // 損兵
            const involvedUserIds = (atkUserIds.concat(defUserIds)).filter(u => u>0);
            const involvedUsers = await models.User.findAll({where: {id: {[Op.in]: involvedUserIds}}});
            // console.log('involvedUsers length: ', involvedUsers.length);
            // 結算 user 損耗
            for (let i = 0; i < involvedUsers.length; i++) {
                const user = involvedUsers[i];
                const idxDef = defUserIds.indexOf(user.id);
                const userUpdateData = {};
                let decentSoldier;
                
                if (idxDef >= 0) {  // is defence user
                    decentSoldier = Math.round(detail.defSoldiers[idxDef] * defSoldierRatio * finalDiscountRatio);
                    detail.defSoldierLoses[idxDef] = decentSoldier;
                } else {
                    const idxAtk = atkUserIds.indexOf(user.id);
                    decentSoldier = Math.round(detail.atkSoldiers[idxAtk] * atkSoldierRatio);
                    detail.atkSoldierLoses[idxAtk] = decentSoldier;
                    if (isAttackerWin) { // attacker go to the battle map
                        userUpdateData.mapNowId = warModel.mapId;
                    }
                }
                userUpdateData.mapTargetId = 0;
                userUpdateData.soldier = Math.max(user.soldier - decentSoldier, 0);
                updated.User.push({id: user.id, updated: userUpdateData });
                await user.update(userUpdateData);
            }
            // 被打下的在城人 要換位置或被俘虜
            if (isAttackerWin) {
                const routes = memo.map[warModel.mapId].route;
                const nextMapIds = [];
                routes.map(r => {
                    if (memo.map[r].ownCountryId == warModel.defenceCountryId) { nextMapIds.push(r); }
                });
                const getoutUsers = await models.User.findAll({where: {mapNowId: warModel.mapId}});
                for (let i = 0; i < getoutUsers.length; i++) {
                    let user = getoutUsers[i];
                    let userUpdateData = {};
                    if (user.countryId == warModel.defenceCountryId) {
                        if (nextMapIds.length==0) {
                            userUpdateData.captiveDate = new Date();
                        } else {
                            userUpdateData.mapNowId = nextMapIds[Math.floor(Math.random() * nextMapIds.length)];
                        }
                    } else if (user.captiveDate && user.countryId == warModel.winnerCountryId) {
                        userUpdateData.captiveDate = null;
                    } else {
                        continue
                    }
                    updated.User.push({id: user.id, updated: userUpdateData });
                    await user.update(userUpdateData);
                }
                if (city) { // 陷落是城市 
                    const country = await models.Country.findByPk(warModel.defenceCountryId);
                    if (country.originCityId == city.id) { // 是主城
                        country.originCityId = 0;
                        updated.Country.push({id: country.id, updated: {originCityId: 0}});
                        await country.save();
                    }
                }
            }
        }

        const now = new Date();
        now.setDate(now.getDate() + 1);
        const nextDayTimeMinutes = Math.floor(now.getTime() / 1000 / 60);

        warModel.detail = detail;

        updated.RecordWar.push({
            id: warModel.id,
            mapId: warModel.mapId,
            isAttackerWin,
            isDestoried,
            winnerCountryId: warModel.winnerCountryId,
            detail: detail,
            defenceCountryId: warModel.defenceCountryId,
            atkUserIds: warModel.atkUserIds,
            defUserIds: warModel.defUserIds,
            timestamp: warModel.timestamp,
            attackCountryIds: warModel.attackCountryIds,
            nextDayTimeMinutes,
        });
        await warModel.save();
        if (isAttackerWin) {
            await models.Map.update({ ownCountryId: warModel.winnerCountryId, adventureId: nextDayTimeMinutes }, {where: {id: warModel.mapId}});
        }
        if (autoApply) {
            halfHourTimer.binds.map(fn => fn.apply(null, [[updated], new Date()]));
        }
    } catch (err) {
        console.log('[Battle][HandleWarWinner] err: ', err)
    }
    return updated;
}


async function handleWarLock(warModel) {
    const updated = {RecordWar: []};
    const map = await models.Map.findOne({where: {id: warModel.mapId}});
    const country = await models.Country.findOne({where: {id: map.ownCountryId}});
    const ifOriginCity = country.originCityId == map.cityId;

    if (warModel.gameId > 0) {  // game already set
        return updated;
    }

    // if (ifOriginCity) {
        // const time = new Date(warModel.timestamp);
        // const now = new Date();
        // if (now < time.setDate(time.getDate()-1) ) {
        //     return updated;
        // }
    // }

    const gameTypes = String(map.gameType).split('').map(e => parseInt(e));
    const vsAry = [warModel.atkUserIds.filter(u => u > 0).length, warModel.defUserIds.filter(u => u > 0).length];
    vsAry.sort((a,b) => a-b);
    const vs = `b${vsAry.join('v')}`;
    const games = await models.Game.findAll({where: {type: {[Op.in]: gameTypes}, [vs]: true}});


    const randomGames = [];
    const _tmp = games.map(g => g.id);
    while (_tmp && _tmp.length > 0) {
        let _drawOut = _tmp.splice(Math.floor(Math.random() * (_tmp.length -1)), 1)[0];
        randomGames.splice(Math.floor(Math.random() * randomGames.length), 0, _drawOut);
    }
    const selectedGame = randomGames[Math.floor(Math.random() * (randomGames.length - 1))];
    console.log(`[handleWarLock] ${map.name} games: ${games.map(g => g.name).join(',')} selected: ${selectedGame}`);
    warModel.gameId = selectedGame;
    await warModel.save();
    updated.RecordWar.push({mapId: warModel.mapId, gameId: selectedGame});

    return updated;
}

async function handleDestoried(winCountryId, DestoriedCountryId, atkUserIds = [], atkMoveTo = 0) {
    const updatedUsers = [];
    let totalMoney = 0;
    let totalSoldier = 0;
    const destoriedUsers = await models.User.findAll({where: {countryId: DestoriedCountryId}});
    for (let i = 0; i < destoriedUsers.length; i++) {
        let user = destoriedUsers[i];
        let userUpdateData = {};
        totalMoney += user.money;
        totalSoldier += user.soldier;
        userUpdateData.money = 0;
        userUpdateData.soldier = 0;
        userUpdateData.countryId = 0;
        userUpdateData.role = enums.ROLE_FREEMAN;
        userUpdateData.actPointMax = 3;
        userUpdateData.occupationId = 0;
        userUpdateData.mapTargetId = 0;
        userUpdateData.captiveDate = null;
        userUpdateData.mapNowId = user.captiveDate ? user.mapNowId : Math.round(Math.random() * 120)+1;
        if (user.destoryByCountryIds && Array.isArray(user.destoryByCountryIds) && user.destoryByCountryIds.length > 0) {
            // userUpdateData.destoryByCountryIds = JSON.parse(user.destoryByCountryIds);
            userUpdateData.destoryByCountryIds.push(winCountryId);
        } else {
            userUpdateData.destoryByCountryIds = [winCountryId];
        }
        
        updatedUsers.push({id: user.id, updated: userUpdateData });
        await user.update(userUpdateData);
        await models.UserTime.create({
            utype: enums.TYPE_USERTIME_FREE,
            userId: user.id,
            before: JSON.stringify({"User": {isDestoried: true}}),
            after: JSON.stringify({"User": userUpdateData}),
            timestamp: new Date()
        });
    }
    // detail.defSoldierLoses = detail.defSoldiers;

    await models.Country.update({
        emperorId: 0,
        originCityId: 0,
    }, {where: {id: DestoriedCountryId}});

    // 累積的黃金兵力給主公
    const winUsers = await models.User.findAll({where: {countryId: winCountryId}});
    for (let i = 0; i < winUsers.length; i++) {
        let user = winUsers[i];
        let userUpdateData = {};
        userUpdateData.contribution = user.contribution + 50;
        
        if (user.role == enums.ROLE_EMPEROR) {
            userUpdateData.soldier = user.soldier + totalSoldier;
            userUpdateData.money = user.money + totalMoney;
        }
        // 出征者移到
        if (atkUserIds.includes(user.id)) {
            if (atkMoveTo) {
                userUpdateData.mapNowId = atkMoveTo;
            }
            userUpdateData.mapTargetId = 0;
        }
        
        updatedUsers.push({id: user.id, updated: userUpdateData });
        await user.update(userUpdateData);
    }

    // 滅國後的週圍地圖戰役
    const nearWars = await models.RecordWar.findAll({where: { defenceCountryId: winCountryId, winnerCountryId: 0}});
    for (let i = 0; i < nearWars.length; i++) {
        let _war = nearWars[i];
        if (_war.attackCountryIds[0] == DestoriedCountryId) {
            _war.winnerCountryId = winCountryId;
            await _war.save();
        }
    }
    return updatedUsers
}


module.exports = {
    init,
    bindSuccessfulRBF,
    handleWarWinner,
    handleWarLock,
    handleDestoried,
}