const mapdata = {
    ary: [],
    hash: {},
};

function setData(data) {
    if (Array.isArray(data)) {
        let next_hash = {};
        mapdata.ary = data.map(d => {
            if (typeof d.route == 'string') { d.route = d.route.split(',').map(_ => parseInt(_)); }
            next_hash[d.id] = d;
            return d;
        });
        mapdata.hash = next_hash;
    } else {
        mapdata.hash = data;
        mapdata.ary = Object.values(data);
        mapdata.ary.sort((a,b) => a.id - b.id);
    }
    return true;
}

function getAllowedPosition(nowId, moveEnergy = 1, countryId = 0) {
    const _hash = mapdata.hash;
    const _now = _hash[nowId];
    const stpeRoutes = {};
    const all_routes = [];
    const checkCountry = countryId > 0;
    let _step = 0;
    if (_now) {
        while (_step++ < moveEnergy) {
            let lastRoutes = stpeRoutes[_step-1];
            let nextRoutes = [];
            if (lastRoutes) {
                lastRoutes.map(rs => {
                    const _loc = _hash[rs];
                    let _routes = _loc.route;
                    if (checkCountry) {
                        _routes = _routes.filter(r => _hash[r].ownCountryId === countryId);
                    }
                    _routes.map(_next => {
                        if (!all_routes.includes(_next) && _next != nowId) {
                            nextRoutes.push(_next);
                            all_routes.push(_next);
                        }
                    });
                });
            } else {
                nextRoutes = _now.route.slice();
                if (checkCountry) {
                    nextRoutes = nextRoutes.filter(r => _hash[r].ownCountryId === countryId)
                }
                nextRoutes.map(r => {
                    all_routes.push(r);
                });
            }
            stpeRoutes[_step] = nextRoutes;
            if (nextRoutes.length == 0) { break }
        }
    }
    return {all: all_routes, steps: stpeRoutes};
}

function getBattlePosition(nowId, countryId = 0) {
    const _hash = mapdata.hash;
    const _now = _hash[nowId];
    if (countryId == 0) { return [] }
    const positions = _now.route.filter(r => _hash[r].ownCountryId != countryId);
    return positions
}



export default {
    setData,
    getAllowedPosition,
    getBattlePosition
}