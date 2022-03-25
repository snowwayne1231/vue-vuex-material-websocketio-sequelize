const enums = require('../src/enum');


function validate(act, payload, userinfo, memo) {
    const res = { ok: false, msg: '' };

    switch (act) {
        case enums.ACT_MOVE: {
            res.msg = isNoTarget(userinfo) || isExistMap(payload, memo) || isAllowedGo(userinfo, memo.mapIdMap[payload]) || isNotBeCaptived(userinfo);
        } break
        case enums.ACT_LEAVE_COUNTRY: {
            res.msg = isNoTarget(userinfo) || hasPoint(userinfo) || isRoleWarrier(userinfo) || isNotLoyal(userinfo);
        } break
        case enums.ACT_ENTER_COUNTRY: {
            res.msg = isNoTarget(userinfo) || isExistMap(userinfo.mapNowId, memo) || hasPoint(userinfo) || isNoCountry(userinfo) || isMyStandMapHasCountry(userinfo, memo)|| isNotDestoriedByMapCountry(userinfo, memo) || isNotBeCaptived(userinfo);
        } break
        case enums.ACT_SEARCH_WILD: {
            res.msg = hasPoint(userinfo) || isRoleNotFree(userinfo) || isHereWildMap(userinfo.mapNowId, memo) || isNotBeCaptived(userinfo);
        } break
        case enums.ACT_BUSINESS: {
            res.msg = hasPoint(userinfo) || isRoleNotFree(userinfo) || isHereCityMap(userinfo.mapNowId, memo) || isInCountryHere(userinfo, memo) || isNotBeCaptived(userinfo);
        } break
        case enums.ACT_INCREASE_SOLDIER: {
            res.msg = hasPoint(userinfo) || isRoleNotFree(userinfo) || isHereCityMap(userinfo.mapNowId, memo) || isInCountryHere(userinfo, memo) || isNotBeCaptived(userinfo);
        } break
        case enums.ACT_BATTLE: {
            const mapId = payload.mapId;
            res.msg = isNoTarget(userinfo) || isExistMap(mapId, memo) || isEnemyMap(userinfo, mapId, memo) || isInCountry(userinfo, memo) || isNotExistBattlefield(mapId, memo)
                || isNotWorking(userinfo, memo) || hasPoint(userinfo) || haveBasicBattleResource(userinfo) || isNotBeCaptived(userinfo);
        } break
        case enums.ACT_BATTLE_JOIN: {
            const mapId = payload.mapId;
            const battleId = payload.battleId;
            const position = payload.position;
            res.msg = isNoTarget(userinfo) || isNotWorking(userinfo, memo) || hasBattle(mapId, battleId, memo) || isEmptyBattlePosition(userinfo, position, mapId, memo) || isNotInvolvedBattle(userinfo, position, mapId, memo) || isNotBeCaptived(userinfo);
        } break
        case enums.ACT_BATTLE_JUDGE: {
            const mapId = payload.mapId;
            const battleId = payload.battleId;
            if (isWelfare(userinfo)=='') { break }
            res.msg = hasBattle(mapId, battleId, memo) || isAllowedJudgeBattleTime(mapId, memo) || imJudge(userinfo, mapId, memo);
        } break
        case enums.ACT_APPOINTMENT: {
            const userId = payload.userId;
            const occupationId = payload.occupationId;
            res.msg = isRoleEmperor(userinfo) || hasPoint(userinfo, 3) || isSameCountryPartner(userinfo, userId, memo) || isOccupationEnoughContribution(userId, occupationId, memo) || isEmptyOccupation(userId, occupationId, memo);
        } break
        case enums.ACT_DISMISS: {
            const userId = payload.userId;
            res.msg = isRoleEmperor(userinfo) || hasPoint(userinfo, 1) || isSameCountryPartner(userinfo, userId, memo);
        } break
        case enums.ACT_LEVELUP_CITY: {
            const cityId = payload.cityId;
            const constructionName = payload.constructionName;
            res.msg = isExistCity(cityId, memo) || hasPoint(userinfo, 1) || hasCityLevelupMoney(userinfo, cityId, constructionName, memo) || isHereCity(userinfo, cityId, memo) || isNotBeCaptived(userinfo);
        } break
        case enums.ACT_SHARE: {
            const userId = payload.userId;
            const soldier = payload.soldier;
            const money = payload.money;
            // const packetId = payload.packetId;
            console.log('userId: ', userId);
            console.log('soldier: ', soldier);
            console.log('money: ', money);
            res.msg = isAllowedShareUser(userinfo, memo) || hasPoint(userinfo, 1) || isNotBeCaptived(userinfo) || isHereCityMap(userinfo.mapNowId, memo) || isSameCountryPartner(userinfo, userId, memo) || haveSoldier(userinfo, soldier) || haveMoney(userinfo, money);
        } break
        default:
            console.log("Not Found Act: ", act);
            res.msg = 'Unknown Action.';
    }
    res.ok = res.msg == '';
    return res;
}


function isNotWorking(userinfo, memo) {
    const _userId = userinfo.id;
    const _bm = memo.battlefieldMap;
    return _userId > 0 && Object.keys(_bm).map(k => _bm[k].judgeId == _userId || _bm[k].toolmanId == _userId).filter(e => e).length == 0 ? '' : 'Already Working.';
}

function isNoTarget(userinfo) {
    return userinfo.mapTargetId == 0 ? '' : 'Already Has Target.';
}

function isNotBeCaptived(userinfo) {
    return !userinfo.captiveDate ? '' : `Be Captured. [${userinfo.captiveDate.toLocaleDateString()}]`
}

function isExistMap(mapId, memo) {
    return memo.mapIdMap[mapId] ? '' : 'Not Exist Map';
}

function isExistCity(cityId, memo) {
    return memo.cityMap[cityId] ? '' : 'Not Exist City';
}

function isEnemyMap(userinfo, mapId, memo) {
    const _map = memo.mapIdMap[mapId];
    return _map && _map.ownCountryId != userinfo.countryId ? '' : 'Not Enemy Zone.';
}

function isAllowedGo(userinfo, mapData = {}) {
    return userinfo.countryId == 0 || mapData.ownCountryId == userinfo.countryId ? '' : 'Not Allowed Moving.';
}

function hasPoint(userinfo, atLease = 1) {
    return userinfo.actPoint >= atLease ? '' : 'Point Not Enough.';
}

function haveMoney(userinfo, money) {
    return 0 <= money && money <= userinfo.money ? '' : 'Money Not Enough.';
}

function hasCityLevelupMoney(userinfo, cityId, constructionName, memo) {
    const construction = memo.cityMap[cityId].jsonConstruction;
    const atLeaseMoney = construction.hasOwnProperty(constructionName) ? ( 1 + construction[constructionName].lv) * enums.NUM_LEVELUP_TRAPEZOID_SPENDING : -1;
    if (atLeaseMoney == -1) return 'Wrong Lv Of ' + constructionName;
    return haveMoney(userinfo, atLeaseMoney)
}

function isRoleWarrier(userinfo) {
    return userinfo.role == enums.ROLE_GENERMAN ? '' : 'Role Is Not Warrier.';
}

function isRoleNotFree(userinfo) {
    return userinfo.role !== enums.ROLE_FREEMAN ? '' : 'You Are Freeman.';
}

function isRoleEmperor(userinfo) {
    return userinfo.role == enums.ROLE_EMPEROR ? '' : 'You Are Not Emperor.';
}

function isSameCountryPartner(userinfo, partnerId, memo) {
    return memo.userMap[partnerId] && userinfo.countryId == memo.userMap[partnerId].countryId ? '' : 'Not Same Country.';
}

function isNotDestoriedByMapCountry(userinfo, memo) {
    if (userinfo.loyalUserId == 0) return '';
    const _dbciAry = Array.isArray(userinfo.destoryByCountryIds) ? userinfo.destoryByCountryIds : [];
    const _map = memo.mapIdMap[userinfo.mapNowId];
    const _countryid = _map.ownCountryId || 0;
    return !_dbciAry.includes(_countryid) ? '' : 'This Country Has Destoried Me.';
}

function isNotLoyal(userinfo) {
    return userinfo.loyalUserId == 0 ? '' : 'Is Loyalty.';
}

function isInCountry(userinfo, memo) {
    const _countryId = userinfo.countryId;
    return _countryId > 0 && !!memo.countryMap[_countryId] ? '' : 'Disnable Country';
}

function isNoCountry(userinfo) {
    return userinfo.countryId == 0 ? '' : 'Has Country.';
}

function isInCountryHere(userinfo, memo) {
    const _map = memo.mapIdMap[userinfo.mapNowId];
    return _map && userinfo.countryId == _map.ownCountryId ? '' : 'Not This Country Member.';
}

function isMyStandMapHasCountry(userinfo, memo) {
    const _map = memo.mapIdMap[userinfo.mapNowId];
    return !!_map && _map.ownCountryId && !!memo.countryMap[_map.ownCountryId] ? '' : 'No Country Here.';
}

function isHereWildMap(mapNowId, memo) {
    const _map = memo.mapIdMap[mapNowId];
    return _map && _map.type == enums.TYPE_WILD ? '' : 'Not Wild Here.';
}

function isHereCityMap(mapId, memo) {
    const _map = memo.mapIdMap[mapId] || {};
    const _city = memo.cityMap[_map.cityId];
    return _city && _map.type == enums.TYPE_CITY ? '' : 'Not City Here.';
}

function isHereCity(userinfo, cityId, memo) {
    const _mapId = userinfo.mapNowId;
    const _map = memo.mapIdMap[_mapId];
    return _map && cityId == _map.cityId ? '' : 'Is Not This City.';
}

function isNotExistBattlefield(mapId, memo) {
    return !memo.battlefieldMap[mapId] ? '' : 'Already Fighting On Battlefield.';
}

function haveBasicBattleResource(userinfo) {
    const moneySpend = 100;
    const soldierSpend = 1000;
    return  userinfo.money >= moneySpend && userinfo.soldier >= soldierSpend ? '' : 'Not Enough Resource.';
}

function hasBattle(mapId, battleId, memo) {
    const _battle = memo.battlefieldMap[mapId];
    return _battle && _battle.id == battleId ? '' : 'Not Exist Battle.';
}

function haveSoldier(userinfo, soldier) {
    return 0 <= soldier && soldier <= userinfo.soldier ? '' : 'Do Not Have Enough Soldiers.';
}

function isEmptyBattlePosition(userinfo, position, mapId, memo) {
    const _battle = memo.battlefieldMap[mapId];
    const _countryId = userinfo.countryId;
    let _pb = false;
    // console.log('_battle: ', _battle);
    switch (position) {
        case 4: _pb =  _battle.judgeId == 0; break
        case 5: _pb =  _battle.toolmanId == 0; break
        default:
            _pb = (_battle.defenceCountryId == _countryId && _battle.defUserIds[position] == 0) || (_battle.attackCountryIds.includes(_countryId) && _battle.atkUserIds[position] == 0);
    }
    return _pb ? '' : 'Battlefield Position Not Empty.';
}

function isNotInvolvedBattle(userinfo, position, mapId, memo) {
    const _battle = memo.battlefieldMap[mapId];
    if ([4,5].includes(position)) {
        const _countryId = userinfo.countryId;
        return _countryId != _battle.defenceCountryId && !_battle.attackCountryIds.includes(_countryId) ? '' : 'Country Is Inovlved This Battle.';
    } else {
        const _userId = userinfo.id;
        return !_battle.defUserIds.includes(_userId) && !_battle.atkUserIds.includes(_userId) ? '' : 'Alredy Join This Battle.';
    }
}

function isAllowedJudgeBattleTime(mapId, memo) {
    const battlefieldMap = memo.battlefieldMap;
    const thisBattle = battlefieldMap[mapId];
    const battleKeys = Object.keys(battlefieldMap);
    let isAllowedTime = thisBattle.timestamp.getTime() < new Date().getTime();
    if (battleKeys.length > 0) {
        const olderestBattleKey = battleKeys.sort((a,b) => {
            return battlefieldMap[a].timestamp.getTime() - battlefieldMap[b].timestamp.getTime();
        })[0];
        if (olderestBattleKey != mapId) {
            return 'Is Not The Lasest Battle.';
        }
    }
    return isAllowedTime ? '' : 'Time Expire Not Yet.';
}

function isOccupationEnoughContribution(userId, occupationId, memo) {
    const _occu = memo.occupationMap[occupationId];
    const _user = memo.userMap[userId];
    return _occu && _user && _user.contribution >= _occu.contributionCondi ? '' : 'Not Enough Occupation Condition.';
}

function isEmptyOccupation(userId, occupationId, memo) {
    const _user = memo.userMap[userId];
    const _users = Object.values(memo.userMap).filter(u => u.countryId == _user.countryId);
    return _users.findIndex(u => u.occupationId == occupationId) == -1 ? '' : 'Double Occupation.';
}

function isWelfare(userinfo) {
    return ['R307', 'R343', 'R064'].includes(userinfo.code) ? '' : 'Nont Welfare';
}

function imJudge(userinfo, mapId, memo) {
    const _battlefieldMap = memo.battlefieldMap;
    const _battle = _battlefieldMap[mapId];
    return _battle.judgeId == userinfo.id ? '' : 'Not Judge.';
}

function isAllowedShareUser(userinfo, memo) {
    if (userinfo.role == enums.ROLE_EMPEROR) return '';
    const _myOccupation = memo.occupationMap[userinfo.occupationId];
    return _myOccupation && _myOccupation.isAllowedShare ? '' : 'Not Be Allowed To Share.';
}

module.exports = {
    validate,
}