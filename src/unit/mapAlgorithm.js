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

function getAllowedPosition(nowId, moveEnergy = 1) {
    const _hash = mapdata.hash;
    const _now = _hash[nowId];
    const stpeRoutes = {};
    const all_routes = [];
    let _step = 0;
    if (_now) {
        while (_step++ < moveEnergy) {
            let lastRoutes = stpeRoutes[_step-1];
            let nextRoutes = [];
            if (lastRoutes) {
                lastRoutes.map(rs => {
                    let _loc = _hash[rs];
                    _loc.route.map(_next => {
                        if (!all_routes.includes(_next) && _next != nowId) {
                            nextRoutes.push(_next);
                            all_routes.push(_next);
                        }
                    });
                });
            } else {
                nextRoutes = _now.route.slice();
                nextRoutes.map(r => {
                    all_routes.push(r);
                });
            }
            stpeRoutes[_step] = nextRoutes;
        }
    }
    return {all: all_routes, steps: stpeRoutes};
}



export default {
    setData,
    getAllowedPosition,
}