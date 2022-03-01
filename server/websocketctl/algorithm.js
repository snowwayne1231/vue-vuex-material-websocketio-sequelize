const mapdata = {ary: [], hash: {}}

module.exports = {
    setMapData(data) {
        let next_hash = {};
        mapdata.ary = data.map(d => {
            let _ = {id: d.id, route: d.route, city: d.cityId, country: d.countryId}
            if (typeof d.route == 'string') { _.route = d.route.split(',').map(_ => parseInt(_)); }
            next_hash[d.id] = _;
            return _;
        });
        mapdata.hash = next_hash;
    },
    getMapDistance(start, end) {
        const hash = mapdata.hash;
        let distance = 0;
        if (start!=end) {
            let _now = hash[start];
            let _termial = hash[end];
            if (_now && _termial) {
                let frontends = [start];
                let backends = [end];
                let frontendStep = {0: _now.route};
                let backendStep = {0: _termial.route};
                let _step = 0;
                let _founded = false;
                while (_step++ < 15 && !_founded) {
                    distance += 1;
                    let _frontendbefores = frontendStep[_step-1];
                    let _freontedNextRoutes = [];
                    for (let _f = 0; _f < _frontendbefores.length; _f++) {
                        let _ff = _frontendbefores[_f];
                        if (backends.includes(_ff)) {
                            _founded = true;
                            break
                        } else if(!frontends.includes(_ff)) {
                            frontends.push(_ff);
                            let side = hash[_ff];
                            side && side.route.map(s => {
                                _freontedNextRoutes.push(s);
                            });
                        }
                    }
                    frontendStep[_step] = _freontedNextRoutes;
                    if (_founded) { break }

                    distance += 1;
                    let _backendbefores = backendStep[_step-1];
                    let _backNextRoutes = [];
                    for (let _b = 0; _b < _backendbefores.length; _b++) {
                        let _bb = _backendbefores[_b];
                        if (frontends.includes(_bb)) {
                            _founded = true;
                            break
                        } else if(!backends.includes(_bb)) {
                            backends.push(_bb);
                            let side = hash[_bb];
                            side && side.route.map(s => {
                                _backNextRoutes.push(s);
                            });
                        }
                    }
                    backendStep[_step] = _backNextRoutes;
                    if (_founded) { break }
                }
            }
        }
        return distance;
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
                obj[key] = _loc.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(_loc) : JSON.parse(_loc);
            }
        });
        return obj;
    },    
}