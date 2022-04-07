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
    ATKLOSE: (x, y) => (Math.min(y/x, 1)*0.5),
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
        const prepareTimestamp = now.setDate(now.getDate() +(isTest ? 8 : 3));
        models.RecordWar.findAll({where: { winnerCountryId: 0, gameId: 0, timestamp: {[Op.lte]: prepareTimestamp} }}).then(wars => {
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
    const updated = {RecordWar: [], User: []};
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
                    finalDiscountRatio = 1 - ((jsonConstruction.wall.lv * enums.NUM_ADDITIONAL_WALL_DISCOUNT_DAMAGE_RATIO) / 100);
                }
            }
        }
        // console.log('finalDiscountRatio: ', finalDiscountRatio);
        detail.finalDiscountRatio = finalDiscountRatio;
        detail.atkSoldierRatio = atkSoldierRatio;
        detail.defSoldierRatio = defSoldierRatio;
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

        // 發生滅國
        if (isDestoried) {
            const destoriedUsers = await models.User.findAll({where: {countryId: warModel.defenceCountryId}});
            for (let i = 0; i < destoriedUsers.length; i++) {
                let user = destoriedUsers[i];
                let userUpdateData = {};
                userUpdateData.money = 0;
                userUpdateData.soldier = 0;
                userUpdateData.countryId = 0;
                userUpdateData.role = enums.ROLE_FREEMAN;
                userUpdateData.actPointMax = 3;
                userUpdateData.occupationId = 0;
                userUpdateData.captiveDate = null;
                userUpdateData.mapNowId = Math.round(Math.random() * 120)+1;
                if (user.destoryByCountryIds && user.destoryByCountryIds.length > 0) {
                    userUpdateData.destoryByCountryIds = JSON.parse(user.destoryByCountryIds);
                    userUpdateData.destoryByCountryIds.push(warModel.winnerCountryId);
                } else {
                    userUpdateData.destoryByCountryIds = [warModel.winnerCountryId];
                }
                
                updated.User.push({id: user.id, updated: userUpdateData });
                await user.update(userUpdateData);
                await models.UserTime.create({
                    utype: enums.TYPE_USERTIME_FREE,
                    userId: user.id,
                    before: JSON.stringify({"User": {isDestoried: true}}),
                    after: JSON.stringify({"User": userUpdateData}),
                    timestamp: new Date()
                });
            }

            await models.Country.update({
                emperorId: 0,
                originCityId: 0,
            }, {where: {id: warModel.defenceCountryId}});
        }

        if (isAttackerWin) {
            // 被打下的在城人 要換位置或被俘虜
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
                } else if (user.captiveDate) {
                    userUpdateData.captiveDate = null;
                } else {
                    continue
                }
                updated.User.push({id: user.id, updated: userUpdateData });
                await user.update(userUpdateData);
            }
        }

        warModel.detail = detail;

        updated.RecordWar.push({ id: warModel.id, mapId: warModel.mapId, isAttackerWin, isDestoried, winnerCountryId: warModel.winnerCountryId, detail: detail, defenceCountryId: warModel.defenceCountryId, atkUserIds: warModel.atkUserIds, defUserIds: warModel.defUserIds });
        await warModel.save();
        if (isAttackerWin) {
            await models.Map.update({ownCountryId: warModel.winnerCountryId}, {where: {id: warModel.mapId}});
            if (city && !isDestoried) { // 陷落是城市 
                const country = await models.Country.findByPk(warModel.defenceCountryId);
                if (country.originCityId == city.id) { // 是主城
                    country.originCityId = 0;
                    await country.save();
                }
            }
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

    if (ifOriginCity) {
        const time = new Date(warModel.timestamp);
        const now = new Date();
        if (now < time.setDate(time.getDate()-1) ) {
            return updated;
        }
    }

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



module.exports = {
    init,
    bindSuccessfulRBF,
    handleWarWinner,
    handleWarLock,
}