const models = require('./models');
const { Op } = require("sequelize");
const enums = require('../src/enum');
const halfHourTimer = {
    timer: 0,
    binds: [],
    numHalfHour: 1
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
    setTimeout(() => {
        refresBattlefields();
        halfHourTimer.timer = setInterval(refresBattlefields, 1000 * 60 * halfHourTimer.numHalfHour);
    }, waitMinutes * 60 * 1000);
    return this;
}


function bindSuccessfulRBF(fn) {
    halfHourTimer.binds.push(fn);
}


function refresBattlefields() {
    const now = new Date();
    console.log('[RefresBattlefields] : ', now.toLocaleTimeString());
    const hours = [8, 12, 15, 22];
    const isInHour = hours.includes(now.getHours());
    console.log('maps: ', Object.values(memo.map).map(m => [m.id, m.ownCountryId]).filter(e => e[1] == 7));
    if (isInHour || true) {
        const prepareTimestamp = now.setDate(now.getDate() +3);
        models.RecordWar.findAll({where: { winnerCountryId: 0, timestamp: {[Op.lte]: prepareTimestamp} }}).then(wars => {
            return wars.map(war => {
                let sumDefSoldier = war.detail.defSoldiers.reduce((a,b) => a+b, 0);
                let sumAtkSoldier = war.detail.atkSoldiers.reduce((a,b) => a+b, 0);
                if (sumDefSoldier > sumAtkSoldier) {
                    return handleWarWinner(war, false);
                }
                return null;
            }).filter(e => !!e);
        }).then(e => {
            Promise.all(e).then(res => {
                res.length > 0 && halfHourTimer.binds.map(fn => fn.apply(null, [res, now]));
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

    if (isDestoried) {
        // 滅國全部都要下野
        // userUpdateData.money = 0;
        // userUpdateData.soldier = 0;
        // userUpdateData.countryId = 0;
        // userUpdateData.role = enums.ROLE_FREEMAN;
        // userUpdateData.actPointMax = 3;
        // userUpdateData.occupationId = 0;
    }

    if (isAttackerWin) {
        // 被打下的在城人 要換位置或被俘虜
        // const routes = memo.map[user.mapNowId].route;
        // const nextMapIds = [];
        // routes.map(r => {
        //     if (memo.map[r].ownCountryId == user.countryId) { nextMapIds.push(r); }
        // });
        // if (nextMapIds.length==0) {
        //     userUpdateData.captiveDate = new Date();
        // } else {
        //     userUpdateData.mapNowId = nextMapIds[Math.floor(Math.random() * nextMapIds.length)];
        // }
    }
    
    const involvedUserIds = (atkUserIds.concat(defUserIds)).filter(u => u>0);
    const involvedUsers = await models.User.findAll({where: {id: {[Op.in]: involvedUserIds}}});
    // console.log('involvedUsers length: ', involvedUsers.length);
    for (let i = 0; i < involvedUsers.length; i++) {
        const user = involvedUsers[i];
        const idxDef = defUserIds.indexOf(user.id);
        const userUpdateData = {};
        let decentSoldier;
        
        if (idxDef >= 0) {  // is defence user
            decentSoldier = Math.round(detail.defSoldiers[idxDef] * defSoldierRatio);
            warModel.detail.defSoldierLoses[idxDef] = decentSoldier;
        } else {
            const idxAtk = atkUserIds.indexOf(user.id);
            decentSoldier = Math.round(detail.atkSoldiers[idxAtk] * atkSoldierRatio);
            warModel.detail.atkSoldierLoses[idxAtk] = decentSoldier;
            if (isAttackerWin) { // attacker go to the battle map
                userUpdateData.mapNowId = warModel.mapId;
            }
        }
        userUpdateData.mapTargetId = 0;
        userUpdateData.soldier = Math.max(user.soldier - decentSoldier, 0);
        updated.User.push({id: user.id, updated: userUpdateData });
        await user.update(userUpdateData);
    }

    updated.RecordWar.push({ id: warModel.id, mapId: warModel.mapId, isAttackerWin, isDestoried, winnerCountryId: warModel.winnerCountryId, detail: warModel.detail, defenceCountryId: warModel.defenceCountryId, atkUserIds: warModel.atkUserIds, defUserIds: warModel.defUserIds });
    await warModel.save();
    if (isAttackerWin) {
        await models.Map.update({ownCountryId: warModel.winnerCountryId}, {where: {id: warModel.mapId}});
        memo.map[warModel.mapId].ownCountryId = warModel.winnerCountryId;
    }
    if (autoApply) {
        halfHourTimer.binds.map(fn => fn.apply(null, [[updated], new Date()]));
    }
    return updated;
}


async function cancelBattleByCountryId(countryId) {

}


module.exports = {
    init,
    bindSuccessfulRBF,
    handleWarWinner,
    cancelBattleByCountryId,
}