const enums = require('../src/enum');

function validate(act, payload, userinfo, memo) {
    const res = { ok: false, msg: '' };
    if (!(userinfo && userinfo.id > 0)) { console.log('validate userinfo: ', userinfo); return res; }

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
                || hasPoint(userinfo) || haveBasicBattleResource(userinfo) || isNotBeCaptived(userinfo) || isNearMap(userinfo.id, mapId, memo);
        } break
        case enums.ACT_BATTLE_JOIN: {
            const mapId = payload.mapId;
            const battleId = payload.battleId;
            const position = payload.position;
            res.msg = hasBattle(mapId, battleId, memo) || isEmptyBattlePosition(userinfo, position, mapId, memo) || isNotInvolvedBattle(userinfo, position, mapId, memo) || isNotBeCaptived(userinfo)
                || (position <= 3 ? isNearMap(userinfo.id, mapId, memo) || isNoTarget(userinfo) : hasPoint(userinfo, 1) || isNotWorking(userinfo, memo));
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
            res.msg = isRoleEmperor(userinfo) || hasPoint(userinfo, 1) || isSameCountryPartner(userinfo, userId, memo) || isUserNoTarget(userId, memo);
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
            const itemId = payload.itemId;
            // const packetId = payload.packetId;
            res.msg = isAllowedShareUser(userinfo, memo) || hasPoint(userinfo, 1) || isNotBeCaptived(userinfo) || isHereCityMap(userinfo.mapNowId, memo) || isSameCountryPartner(userinfo, userId, memo) || haveSoldier(userinfo, soldier)
             || haveMoney(userinfo, money) || isAllowedShareItem(itemId, userinfo, memo);
        } break
        case enums.ACT_ESCAPE: {
            const money = payload.money;
            res.msg = isBeCaptived(userinfo) || hasPoint(userinfo, 1) || haveMoney(userinfo, money) || isExistOriginCity(userinfo, memo);
        } break
        case enums.ACT_BATTLE_SELECT_GAME: {
            const battleId = payload.battleId;
            const mapId = payload.mapId;
            const gameId = payload.gameId;
            res.msg = isExistMap(mapId, memo) || hasBattle(mapId, battleId, memo) || isOriginCity(mapId, memo) || isMyOwnCountryMap(mapId, userinfo, memo) || isExistGame(gameId, memo) || availableGameInBattle(gameId, mapId, memo);
        } break
        case enums.ACT_GET_BATTLE_DETAIL: {
            const battleId = payload.battleId;
            res.msg = hasRecordBattle(battleId, memo);
        } break
        case enums.ACT_RECRUIT: {
            const userId = payload.userId;
            res.msg = isAllowedRecurit(userinfo, memo) || isFreeMan(userId, memo) || hasPoint(userinfo, 3) || isExistOriginCity(userinfo, memo);
        } break
        case enums.ACT_RECRUIT_CAPTIVE: {
            const userId = payload.userId;
            res.msg = isRoleEmperor(userinfo) || hasPoint(userinfo, 3) || isExistOriginCity(userinfo, memo) || isCaptived(userId, memo) || isInMyCountry(userId, userinfo, memo) || isUserRoleNotEmperor(userId, memo) || isUserNoTarget(userId, memo);
        } break
        case enums.ACT_RELEASE_CAPTIVE: {
            const userId = payload.userId;
            res.msg = isRoleEmperor(userinfo) || hasPoint(userinfo, 1) || isCaptived(userId, memo) || isInMyCountry(userId, userinfo, memo) || isUserNoTarget(userId, memo);;
        } break
        case enums.ACT_SET_ORIGIN_CITY: {
            const cityId = payload.cityId;
            const gameTypeId = payload.gameTypeId;
            res.msg = isRoleEmperor(userinfo) || hasPoint(userinfo, 1) || isNoOriginCity(userinfo, memo) || isCityInMyCountry(cityId, userinfo, memo) || isExistGameType(gameTypeId);
        } break
        case enums.ACT_RAISE_COUNTRY: {
            console.log('ACT_RAISE_COUNTRY: ', payload);
            const countryName = payload.countryName;
            const gameTypeId = payload.gameTypeId;
            const colorBg = payload.colorBg;
            const colorText = payload.colorText;
            res.msg = isAllowedCountryName(countryName) || isExistGameType(gameTypeId) || hasPoint(userinfo, 1) || isFreeMan(userinfo.id, memo) || isFiveFreeManHere(userinfo, memo)
                    || isRGBFormat(colorBg) || isRGBFormat(colorText) || isExistMap(userinfo.mapNowId, memo) || isHereCityMap(userinfo.mapNowId, memo) || isNoBattle(userinfo, memo);
        } break
        case enums.ACT_REBELLION: {
            console.log('ACT_REBELLION: ', payload);
            const countryName = payload.countryName;
            const colorBg = payload.colorBg;
            const colorText = payload.colorText;
            const gameTypeId = payload.gameTypeId;
            res.msg = isExistMap(userinfo.mapNowId, memo) || isAllowedRecurit(userinfo, memo) || isAllowedShareUser(userinfo, memo) || isHereCityMap(userinfo.mapNowId, memo) || hasNoKingHere(userinfo, memo)
                    || isNotOriginCity(userinfo.mapNowId, memo) || isAllowedCountryName(countryName) || isRGBFormat(colorBg) || isRGBFormat(colorText) || isExistGameType(gameTypeId) || isNoBattle(userinfo, memo);
        } break
        case enums.ACT_GET_ITEMS: {
            
        } break
        case enums.ACT_USE_ITEM: {
            const itemId = payload.itemId;
            const itemPkId = payload.itemPkId;
            const mapId = payload.mapId;
            res.msg = hasPoint(userinfo, 1) || haveItem(itemId, itemPkId, userinfo, memo) || itemWhenAllowed(itemId, userinfo, memo) || itemObjectAllowed(itemId, mapId, userinfo, memo) || itemLvAllowed(itemId, mapId, userinfo, memo) || itemAllowedEff(itemId, mapId, userinfo, memo);
        } break
        case enums.ACT_BUY_ITEM: {
            const itemId = payload.itemId;
            const mapId = userinfo.mapNowId;
            res.msg = hasPoint(userinfo, 1) || haveSeller(itemId, mapId, memo) || haveItemMoney(itemId, userinfo, memo)
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

function isUserNoTarget(userId, memo) {
    const user = memo.userMap[userId];
    return user && user.mapTargetId == 0 ? '' : 'User Already Has Target.';
}

function isNotBeCaptived(userinfo) {
    return !userinfo.captiveDate ? '' : `Be Captured. [${userinfo.captiveDate.toLocaleDateString()}]`
}

function isBeCaptived(userinfo) {
    return userinfo.captiveDate ? '' : 'Not Be Catured.';
}

function isCaptived(userId, memo) {
    return memo.userMap[userId] && memo.userMap[userId].captiveDate ? '' : 'Not A Catured User.';
}

function isExistMap(mapId, memo) {
    return memo.mapIdMap[mapId] ? '' : 'Not Exist Map';
}

function isExistCity(cityId, memo) {
    return memo.cityMap[cityId] ? '' : 'Not Exist City';
}

function isOriginCity(mapId, memo) {
    const map = memo.mapIdMap[mapId];
    const country = memo.countryMap[map.ownCountryId];
    return isExistCity(map.cityId, memo) == '' && country.originCityId == map.cityId ? '' : 'Is Not Origin City.';
}

function isNotOriginCity(mapId, memo) {
    const map = memo.mapIdMap[mapId];
    const cityId = map.cityId;
    const country = memo.countryMap[map.ownCountryId];
    return country && country.originCityId != cityId ? '' : 'This is Origin City.';
}

function isExistOriginCity(userinfo, memo) {
    const country = memo.countryMap[userinfo.countryId];
    return country && isExistCity(country.originCityId, memo) == '' ? '' : 'Not Exist Origin City.';
}

function isNoOriginCity(userinfo, memo) {
    const country = memo.countryMap[userinfo.countryId];
    return country && country.originCityId == 0 ? '' : 'Have Origin City.';
}

function isExistGame(gameId, memo) {
    return memo.gameMap[gameId] ? '' : 'Not Exist Game.';
}

function isExistGameType(gameTypeId) {
    return enums.CHINESE_GAMETYPE_NAMES[String(gameTypeId).trim()] ? '' : 'Not Exsit Game Type.';
}

function isEnemyMap(userinfo, mapId, memo) {
    const _map = memo.mapIdMap[mapId];
    return _map && _map.ownCountryId != userinfo.countryId ? '' : 'Not Enemy Zone.';
}

function isAllowedGo(userinfo, mapData = {}) {
    return userinfo.countryId == 0 || mapData.ownCountryId == userinfo.countryId ? '' : 'Not Allowed Moving.';
}

function hasNoKingHere(userinfo, memo) {
    const _mapid = userinfo.mapNowId;
    const _map = Object.values(memo.userMap).filter(user => user.role == 1 && user.mapNowId == _mapid);
    return _map == 0 ? '' : 'Has King Right Here.';
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
    if (construction[constructionName].lv >= 10) return 'Lv Out Of Max.';
    return haveMoney(userinfo, atLeaseMoney)
}

function isRoleWarrier(userinfo) {
    return userinfo.role == enums.ROLE_GENERMAN ? '' : 'Role Is Not Warrier.';
}

function isRoleNotFree(userinfo) {
    return userinfo.role !== enums.ROLE_FREEMAN ? '' : 'You Are Freeman.';
}

function isFreeMan(userId, memo) {
    return memo.userMap[userId] && memo.userMap[userId].role == enums.ROLE_FREEMAN ? '' : 'Not Freeman.';
}

function isFiveFreeManHere(userinfo, memo) {
    const imhere = userinfo.mapNowId;
    const users = Object.values(memo.userMap).filter(user => user.mapNowId == imhere);
    const freemans = users.filter(user => user.role == enums.ROLE_FREEMAN);
    return freemans.length >= 5 && users.length == freemans.length ? '' : 'Not Just >= 5 Freeman In Here.';
}

function isRoleEmperor(userinfo) {
    return userinfo.role == enums.ROLE_EMPEROR ? '' : 'You Are Not Emperor.';
}

function isUserRoleNotEmperor(userId, memo) {
    return memo.userMap[userId] && memo.userMap[userId].role != enums.ROLE_EMPEROR ? '' : 'User Is Emperor.';
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

function isMyOwnCountryMap(mapId, userinfo, memo) {
    const _map = memo.mapIdMap[mapId];
    return _map && _map.ownCountryId == userinfo.countryId ? '' : 'Not Own Map.';
}

function isInMyCountry(userId, userinfo, memo) {
    const user = memo.userMap[userId];
    const location = memo.mapIdMap[user.mapNowId];
    return location && location.ownCountryId == userinfo.countryId ? '' : 'Not In My Country.';
}

function isCityInMyCountry(cityId, userinfo, memo) {
    const map = Object.values(memo.mapIdMap).find(m => m.cityId == cityId);
    return cityId > 0 && map && map.ownCountryId == userinfo.countryId ? '' : 'City Not In My Country.';
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

function isNoBattle(userinfo, memo) {
    const _mapid = userinfo.mapNowId;
    const _battle = memo.battlefieldMap[_mapid];
    return !_battle ? '' : 'Has Battle On Map.';
}

function hasRecordBattle(battleId, memo) {
    return memo.warRecords.find(w => w.id == battleId) ? '' : 'Not Exist Battle.';
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

function availableGameInBattle(gameId, mapId, memo) {
    const game = memo.gameMap[gameId];
    const battle = memo.battlefieldMap[mapId];
    const map = memo.mapIdMap[mapId];
    // const now = new Date();
    // now.setDate(now.getDate()+3);
    // if (now < new Date(battle.timestamp)) {
    //     return 'Not Time Yet.';
    // }
    const vsAry = [battle.atkUserIds.filter(u => u > 0).length, battle.defUserIds.filter(u => u > 0).length];
    vsAry.sort((a,b) => a-b);
    const vs = `b${vsAry.join('v')}`;
    let gameTypes = String(map.gameType).split('');
    if (gameTypes.length > 0) {
        gameTypes = gameTypes.map(gt => parseInt(gt));
    }
    return battle.gameId == 0 && game && game[vs] && gameTypes.includes(game.type) ? '' : 'Not Available Game.';
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

function isAllowedShareItem(itemId, userinfo, memo) {
    if (!itemId) { return ''; }
    const userItems = memo.userPacketItemMap[userinfo.id] || [];
    const targetItems = userItems.filter(item => item.itemId == itemId && item.status == 1)
    return (targetItems.length > 0) ? '' : 'No Item.'
}

function isAllowedRecurit(userinfo, memo) {
    if (userinfo.role == enums.ROLE_EMPEROR) return '';
    const _myOccupation = memo.occupationMap[userinfo.occupationId];
    return _myOccupation && _myOccupation.isAllowedRecurit ? '' : 'Not Be Allowed To Recurit.';
}

function isNearMap(userId, mapId, memo) {
    const user = memo.userMap[userId];
    const now = user ? user.mapNowId : 0;
    const map = memo.mapIdMap[now];
    return map && (now == mapId || map.route.includes(mapId)) ? '' : 'Not Near Map.';
}

function isAllowedCountryName(name) {
    return name && name.length <= 2 ? '' : 'Not Allowed Name.';
}

function isRGBFormat(color) {
    return typeof color == 'string' && color.match(/^\#[\w]{6}$/i) ? '' : 'Color Format Not Match.';
}

function haveItem(itemid, pkid, userinfo, memo) {
    const packets = memo.userPacketItemMap[userinfo.id];
    if (packets && packets.length > 0) {
        return packets.filter(e => e.itemId == itemid && e.id == pkid).length > 0 ? '' : 'Do Not Have This Item.';
    }
    return 'Do Not Have Item.';
}

function itemWhenAllowed(itemid, userinfo, memo) {
    const info = memo.itemMap[itemid];
    return info && (info.when == 0 || !userinfo.captiveDate) ? '' : 'Not Allow To Use This Item.';
}

function itemObjectAllowed(itemid, mapid, userinfo, memo) {
    const info = memo.itemMap[itemid];
    const mapInfo = memo.mapIdMap[mapid] || {};
    switch (info.object) {
        case 0: return memo.mapIdMap[userinfo.mapNowId] ? '' : 'Not Stand On Map.';
        case 1: return mapInfo.id ? '' : 'Not Exist Map.';
        case 2: return mapInfo.ownCountryId == userinfo.countryId ? '' : 'Not Same Country.';
        case 3: return mapInfo.ownCountryId != userinfo.countryId ? '' : 'Is Same Country.';
        case 4: return mapInfo.cityId > 0 ? '' : 'Not City.';
        case 5: return mapInfo.cityId > 0 && mapInfo.ownCountryId == userinfo.countryId ? '' : 'Not Friendly City.';
        case 6: return mapInfo.cityId > 0 && mapInfo.ownCountryId != userinfo.countryId ? '' : 'Not Enimily City.';
        case 7: return mapInfo.cityId == 0 ? '' : 'Not Wild';
        case 8: return mapInfo.cityId == 0 && mapInfo.ownCountryId == userinfo.countryId ? '' : 'Not Friendly Wild.';
        case 9: return mapInfo.cityId == 0 && mapInfo.ownCountryId != userinfo.countryId ? '' : 'Not Enimily Wild.';
        default:
            return 'unknown';
    }
}

function itemLvAllowed(itemid, mapid, userinfo, memo) {
    const info = memo.itemMap[itemid];
    if (info.lv > 0) {
        if (info.lv == 1) {
            const mymap = memo.mapIdMap[userinfo.mapNowId];
            return mymap && (mymap.route.includes(mapid) || mymap.id == mapid)? '' : 'Distance Is Not Reached.';
        } else {
            return 'Distance Wrong.'
        }
    }
    return '';
}

function itemAllowedEff(itemid, mapid, userinfo, memo) {
    // 錦囊做防呆機制
    const info = memo.itemMap[itemid];
    switch (info.staticKey) {
        case '_STRATEGY_RECRUIT_': {
            const freemans = Object.values(memo.userMap).filter(user => user.mapNowId == mapid && user.role == enums.ROLE_FREEMAN);
            if (freemans.length == 0) { return 'No Freeman.'; }
        } break
        case '_STRATEGY_MOVE_': {
            if (userinfo.mapNowId == mapid) { return 'Same Map.'; }
        } break
        case '_STRATEGY_CATCH_': {
            const noWarUsers = Object.values(memo.userMap).filter(user => user.mapNowId == mapid && user.mapTargetId == 0 && userinfo.countryId != user.countryId && user.role != enums.ROLE_FREEMAN);
            if (noWarUsers.length == 0) { return 'No Effective Target.'; }
        } break
        case '_STRATEGY_ADD_RESOURCE_':
        case '_STRATEGY_BUILDING_UP_':
        case '_STRATEGY_FIRE_': {
            const _mapid = mapid ? mapid : userinfo.mapNowId;
            const thismap = memo.mapIdMap[_mapid];
            if (!thismap || thismap.cityId == 0) { return 'No Effective Target.'; }
        } break
        case '_STRATEGY_STEAL_': {
            const users = Object.values(memo.userMap).filter(user => user.mapNowId == mapid && user.id != userinfo.id);
            if (users.length == 0) { return 'No Effective Target.'; }
        } break
        case '_STRATEGY_REDUCE_GOLD_':
        case '_STRATEGY_FIRE_STEAL_':
        case '_STRATEGY_KICK_': {
            const users = Object.values(memo.userMap).filter(user => user.mapNowId == mapid && user.countryId != userinfo.countryId);
            if (users.length == 0) { return 'No Effective Target.'; }
        } break
        case '_STRATEGY_EAST_WEST_':
        case '_STRATEGY_TRAPE_': {
            const targetMap = memo.mapIdMap[mapid];
            if (targetMap.route && targetMap.route.length > 0) {
                const mapIds = targetMap.route.concat(mapid);
                const users = Object.values(memo.userMap).filter(user => mapIds.includes(user.mapNowId) && user.countryId == targetMap.ownCountryId);
                if (users.length == 0) { return 'No Effective Target.'; }
            } else {
                return 'Error Map Route';
            }
        } break
        case '_STRATEGY_SNEAK_':
        case '_STRATEGY_SEIZE_': {
            // 子午谷/暗度陳倉 不能放在戰役地圖上
            const battle = memo.battlefieldMap[mapid]
            if (battle) { return 'In Battlefiel.'; }
            // 不能放有人
            const targetMap = memo.mapIdMap[mapid];
            const users = Object.values(memo.userMap).filter(user => user.mapNowId == mapid && user.countryId == targetMap.ownCountryId);
            if (users.length > 0) { return 'Have People.'; }
        } break
        case '_STRATEGY_EMPTY_CITY_':
        case '_STRATEGY_BEAUTY_': {
            // 空城美人 24H
            const mymap = memo.mapIdMap[userinfo.mapNowId];
            const gapHours = 1000*60*60*24;
            const allowedTime = new Date().getTime() + gapHours;
            if (info.staticKey == '_STRATEGY_EMPTY_CITY_') {
                const battle = memo.battlefieldMap[mymap.id];
                if (!battle) {
                    return 'No Battle.';
                }
                const battleTime = new Date(battle.timestamp);
                if (battleTime.getTime() < allowedTime) {
                    return '[24H] Timeout.';
                }
            } else {
                const maps = mymap.route.concat(mymap.id);
                const allowedMaps = maps.filter(mapId => {
                    let _battle = memo.battlefieldMap[mapId];
                    if (_battle) {
                        return new Date(_battle.timestamp).getTime() > allowedTime;
                    }
                    return false;
                });
                return allowedMaps.length > 0 ? '' : 'No Target Battle Works.';
            }
        } break
        case '_STRATEGY_BITTER_':
        case '_STRATEGY_SOLDIER_STEAL_':
        case '_STRATEGY_AVERAGE_': {
            const mymap = memo.mapIdMap[userinfo.mapNowId];
            const mapIds = mymap.route.concat(mymap.id);
            const users = Object.values(memo.userMap).filter(user => mapIds.includes(user.mapNowId) && user.countryId != userinfo.countryId && user.mapTargetId == 0 && user.role != enums.ROLE_FREEMAN);
            if (users.length == 0) { return 'No Effective Target.'; }
        } break
        default:
    }
    return '';
}

function haveSeller(itemid, mapid, memo) {
    const items = memo.businessCtl.getItems();
    const item = items.find(e => e.itemId == itemid);
    if (!item) {
        return 'Do Not Exist This Item.';
    }
    console.log('item: ', item)
    const itemSeller = memo.businessCtl.getSellerMap()[item.seller];
    if (!itemSeller) {
        return 'Wrong Seller.'
    }
    return itemSeller == mapid ? '' : 'Do Not Have Item Seller On Area.';
}

function haveItemMoney(itemid, userinfo, memo) {
    const items = memo.businessCtl.getItems();
    const item = items.find(e => e.itemId == itemid);
    return userinfo.money >= item.price ? '' : 'Not Enough Money.';
}

module.exports = {
    validate,
}