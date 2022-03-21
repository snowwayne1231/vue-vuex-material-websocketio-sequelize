const enums = require('../src/enum');




function validate(act, payload, userinfo, memo) {
    const res = { ok: false, msg: '' };
    if (userinfo.captiveDate) {
        res.msg = 'Be captured. ' + userinfo.captiveDate.toLocaleDateString();
        return res;
    }

    switch (act) {
        case enums.ACT_MOVE: {
            res.msg = isNoTarget(userinfo) || isExistMap(payload, memo) || isAllowedGo(userinfo, memo.mapIdMap[payload]);
        } break
        case enums.ACT_LEAVE_COUNTRY: {
            res.msg = isNoTarget(userinfo) || hasPoint(userinfo) || isRoleWarrier(userinfo) || isNotLoyal(userinfo);
        } break
        case enums.ACT_ENTER_COUNTRY: {
            res.msg = isNoTarget(userinfo) || isExistMap(userinfo.mapNowId, memo) || hasPoint(userinfo) || isNoCountry(userinfo) || isMyStandMapHasCountry(userinfo, memo) || isMyStandMapHasCountry(userinfo, memo) || isDestoriedByMapCountry(userinfo, memo);
        } break
        case enums.ACT_SEARCH_WILD: {
            res.msg = hasPoint(userinfo) || isRoleNotFree(userinfo) || isHereWildMap(userinfo.mapNowId, memo);
        } break
        case enums.ACT_BUSINESS: {
            res.msg = hasPoint(userinfo) || isRoleNotFree(userinfo) || isHereCityMap(userinfo.mapNowId, memo) || isInCountryHere(userinfo, memo);
        } break
        case enums.ACT_INCREASE_SOLDIER: {
            res.msg = hasPoint(userinfo) || isRoleNotFree(userinfo) || isHereCityMap(userinfo.mapNowId, memo) || isInCountryHere(userinfo, memo);
        } break
        case enums.ACT_BATTLE: {
            const mapId = payload.mapId;
            res.msg = isNoTarget(userinfo) || isExistMap(mapId, memo) || isEnemyMap(userinfo, mapId, memo) || isInCountry(userinfo, memo) || isNotExistBattlefield(mapId, memo)
                || isNotWorking(userinfo, memo) || hasPoint(userinfo) || haveBasicBattleResource(userinfo);
        } break
        case enums.ACT_BATTLE_JOIN: {
            const mapId = payload.mapId;
            const battleId = payload.battleId;
            const position = payload.position;
            res.msg = isNoTarget(userinfo) || isNotWorking(userinfo, memo) || hasBattle(mapId, battleId, memo) || isEmptyBattlePosition(userinfo, position, mapId, memo) || isNotInvolvedBattle(userinfo, position, mapId, memo);
        } break
        case enums.ACT_BATTLE_JUDGE: {
            const mapId = payload.mapId;
            const battleId = payload.battleId;
            res.msg = hasBattle(mapId, battleId, memo);
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

function isExistMap(mapId, memo) {
    return !!memo.mapIdMap[mapId] ? '' : 'Not Exist Map';
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

function isDestoriedByMapCountry(userinfo, memo) {
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

module.exports = {
    validate,
}