const enums = require('../../src/enum');
const mapdata = {ary: [], hash: {}}

module.exports = {
    setMapData(data) {
        let next_hash = {};
        mapdata.ary = data.map(d => {
            let _ = {id: d.id, route: d.route, city: d.cityId, country: d.ownCountryId}
            if (typeof d.route == 'string') { _.route = d.route.split(',').map(_ => parseInt(_)); }
            next_hash[d.id] = _;
            return _;
        });
        mapdata.hash = next_hash;
    },
    updateHash(id, key, val) {
        if (mapdata.hash[id]) {
            if (mapdata.hash[id].hasOwnProperty(key)) {
                mapdata.hash[id][key] = val;
            }
        }
    },
    getMapDistance(start, end, countryId = 0) {
        const hash = mapdata.hash;
        const checkCountry = countryId > 0;
        let distance = 0;
        let _founded = false;
        if (start!=end) {
            let _now = hash[start];
            let _termial = hash[end];
            if (_now && _termial) {
                let frontends = [start];
                let backends = [end];
                let frontendStep = {0: (checkCountry ? _now.route.filter(r => hash[r].country == countryId) : _now.route)};
                let backendStep = {0: (checkCountry ? _termial.route.filter(r => hash[r].country == countryId) : _termial.route)};
                let _step = 0;
                
                while (_step++ < 16 && !_founded) {
                    distance += 1;
                    let _frontendbefores = frontendStep[_step-1];
                    let _frontendNextRoutes = [];
                    for (let _f = 0; _f < _frontendbefores.length; _f++) {
                        let _ff = _frontendbefores[_f];
                        let side = hash[_ff];
                        if (backends.includes(_ff)) {
                            _founded = true;
                            break
                        } else if(!frontends.includes(_ff)) {
                            frontends.push(_ff);
                            if (side) {
                                let sideRoute = checkCountry ? side.route.filter(r => hash[r].country == countryId) : side.route;
                                sideRoute.map(s => {
                                    _frontendNextRoutes.push(s);
                                });
                            }
                        }
                    }
                    frontendStep[_step] = _frontendNextRoutes;
                    if (_founded || _frontendNextRoutes.length == 0) { break }

                    distance += 1;
                    let _backendbefores = backendStep[_step-1];
                    let _backNextRoutes = [];
                    for (let _b = 0; _b < _backendbefores.length; _b++) {
                        let _bb = _backendbefores[_b];
                        let side = hash[_bb];
                        if (frontends.includes(_bb)) {
                            _founded = true;
                            break
                        } else if(!backends.includes(_bb)) {
                            backends.push(_bb);
                            if (side) {
                                let sideRoute = checkCountry ? side.route.filter(r => hash[r].country == countryId) : side.route;
                                sideRoute.map(s => {
                                    _backNextRoutes.push(s);
                                });
                            }
                        }
                    }
                    backendStep[_step] = _backNextRoutes;
                    if (_founded || _backNextRoutes.length == 0) { break }
                }
            }
        } else {
            return 0;
        }
        return _founded ? distance : -1;
    },
    flatMap(obj, col) {
        return Object.values(obj).map(e => {
            let _ = [];
            col.map(c => { _.push(e[c]) });
            return _;
        });
    },
    parseJson(obj, keys = []) {
        keys.forEach(key => {
            let _loc = obj[key];
            if (typeof _loc == 'string') {
                try {
                    obj[key] = _loc.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(_loc) : JSON.parse(_loc);
                } catch(err) {
                    console.log('[parseJson] err: ', err, ' key: ', key, ' val: ', obj[key]);
                    obj[key] = [];
                }
            }
        });
        return obj;
    },
    getTimeOptions(occupiedTimes) {
        const vacations = [909, 910, 1010, 102];
        const allowedHours = [800, 1200, 1230, 1530, 2230];
        const afterDays = 7;
        const timeOptions = [];
        const startDate = new Date();
        startDate.setSeconds(0);
        startDate.setMilliseconds(0);
        const startWeekDay = startDate.getDay();
        startDate.setDate(startDate.getDate() + afterDays + (startWeekDay == 0 ? 1 : (startWeekDay == 6 ? 2 : 0)));
        
        if (occupiedTimes.length > 0 && startDate.getTime() < occupiedTimes[-1]) {
            startDate.setTime(occupiedTimes[-1]);
        }

        let day = 0;
        while (timeOptions.length < 5 && day++ < afterDays) {
            let _weekday = startDate.getDay();
            let startDateDecimal = ((startDate.getMonth() + 1) * 100) + startDate.getDate();
            if (_weekday > 0 && _weekday <= 5 && !vacations.includes(startDateDecimal)) {
                for(let i = 0; i < allowedHours.length; i++) {
                    let loc = allowedHours[i];
                    let hour = Math.floor(loc / 100);
                    let minute = loc % 100;
                    if (startDate.getHours() < hour || ( startDate.getHours() == hour && startDate.getMinutes() < minute )) {
                        startDate.setHours(hour);
                        startDate.setMinutes(minute);
                        if (!occupiedTimes.includes(startDate.getTime())) {
                            timeOptions.push(new Date(startDate.getTime()));
                            if (timeOptions.length >= 5) break
                        }
                    }
                }
            }
            startDate.setDate(startDate.getDate() +1);
            startDate.setHours(1);
        }
        return timeOptions;
    },
    getMapIdByCityId(cityId) {
        return cityId > 0 ? mapdata.ary.find(m => m.city == cityId).id : 0;
    },
    isValidatedBattleTime(timestamp) {
        const allowedHours = [8, 12, 15, 22];
        const allowedAfterDays = 7;
        const now = new Date();
        const selected = new Date(timestamp);
        const gap = selected.getTime() - now.getTime();
        if (gap < allowedAfterDays * 1000 * 60 * 60 * 24) {
            return false;
        }
        if (!allowedHours.includes(selected.getHours())) {
            return false;
        }
        return true;
    },
    isWelfare(user) {
        return ['R307', 'R064', 'R343'].includes(user.code);
    },
    isWorking(userId, memo) {
        const bm = memo.battlefieldMap;
        return userId > 0 && Object.keys(bm).map(k => bm[k].judgeId == userId || bm[k].toolmanId == userId).filter(e => e).length > 0;
    },
    randomIncreaseSoldier(countryId, constructlv = 0) {
        const numCities = mapdata.ary.filter(m => m.country == countryId && m.city > 0).length;
        const max = 200 + (numCities * 15);
        const additionalConstruct = constructlv * enums.NUM_ADDITIONAL_BARRACK_SOLDIER;
        const maxRes = max + 100 + additionalConstruct;
        const add = Math.min(Math.round(Math.random() * max) + 100 + additionalConstruct + constructlv, maxRes);
        return {add, lucky: add / maxRes > 0.97};
    },
    getMsgLevelUp(nickname, came, cityName, lv) {
        const chiName = enums.CHINESE_CONSTRUCTION_NAMES[came];
        return `${nickname} 將 ${cityName}的${chiName} 升級至 Lv( ${lv} )`;
    },
    getMsgJoinBattle(nickname, soldier, mapName) {
        return `${nickname} 領兵 ${soldier} 加入了 ${mapName} 的戰役`;   
    },
    getMsgShare(starterName, targetName, money = 0, soldier = 0, item = '') {
        let resource = '';
        if (money > 0) {
            resource += `${money} 黃金 `;
        }
        if (soldier > 0) {
            resource += `${soldier} 士兵 `;
        }
        if (item.length > 0) {
            resource += `${item} 錦囊 `;
        }
        return `${starterName} 配給了 ${targetName} 共 ${resource}`;   
    },
    getMsgBattleGameSelected(mapName, gameName) {
        return `${mapName}之戰 項目已確定為：${gameName}`;
    },
    getMsgLuckyMoney(nickname, money, isBusiness = false) {
        return `${nickname} 人品爆發 ${isBusiness ? '使用商業' : ''}獲得 ${money} 黃金`;
    },
    getMsgLuckySoldier(nickname, soldier) {
        return `${nickname} 人品爆發 獲得 ${soldier} 位士兵慕名而來`;
    },
    getMsgRecruitFail(selfname, nickname, isCaptiveTarget = false) {
        return isCaptiveTarget ?
            `${selfname} 招募失敗 ${nickname} 已無歸屬可回,繼續待在地牢`:
            `${selfname} 招募 ${nickname} 失敗`;
    },
}