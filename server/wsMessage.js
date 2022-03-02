const enums = require('../src/enum');
const models = require('./models');
const algorithms = require('./websocketctl/algorithm');

function onMessage(socket, asyncUpdateUserInfo, memoController) {

    socket.on(enums.MESSAGE, (msg) => {
        const act = msg.act || '';
        const payload = msg.payload || {};
        const userinfo = socket.request.session.userinfo;
        let switched = subSwitchOnMessage(act, payload, userinfo);
        return switched && switched.catch(err => console.log(err));
    });

    socket.on(enums.ADMIN_CONTROL, (msg) => {
        const userinfo = socket.request.session.userinfo;
        if (userinfo.code == 'R343') {
            const modelName = msg.model || '';
            const insModel = models[modelName];
            if (insModel) {
                try {
                    insModel.update(msg.update, {where: msg.where});
                } catch (err) {
                    console.log('ADMIN CTL error: ', err);
                }
            } else {
                console.log('Failed. model name wrong: ', msg);
            }
        } else {
            console.log('Failed. userinfo: ', userinfo);
        }
    });

    return true;


    function subSwitchOnMessage(act, payload, userinfo) {
        
        switch (act) {
            case enums.ACT_GET_GLOBAL_USERS_INFO: {
                const ugAttributes = enums.UserGlobalAttributes;
                let users = Object.values(memoController.userMap).map(user => {
                    let _ = [];
                    ugAttributes.map(col => { _.push(user[col]); });
                    return _;
                });
                return subEmitMessage(act, {users});
            }
            case enums.ACT_MOVE: {
                const targetId = payload;
                const nowId = userinfo.mapNowId;
                const dis = algorithms.getMapDistance(nowId, targetId);
                const targetMap = memoController.mapIdMap[targetId];
                if (dis <= userinfo.actPoint && targetMap && (userinfo.countryId == 0 || targetMap.ownCountryId == userinfo.countryId)) {
                    return asyncUpdateUserInfo(userinfo, {mapNowId: targetId, actPoint: userinfo.actPoint - dis}, act, socket);
                } else {
                    return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
                }
            }
            case enums.ACT_LEAVE_COUNTRY: {
                if (userinfo.actPoint > 0 && userinfo.role == 2 && (userinfo.loyalUserId == 0 || userinfo.destoryByCountryIds.length > 0)) {
                    return asyncUpdateUserInfo(userinfo, { countryId: 0, role: enums.ROLE_FREEMAN, actPoint: 0, money: 0, soldier: 0 }, act, socket)
                } else {
                    return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
                }
            }
            case enums.ACT_ENTER_COUNTRY: {
                const mapId = userinfo.mapNowId;
                const thisMap = memoController.mapIdMap[mapId];
                if (thisMap && userinfo.actPoint > 0) {
                    const thisCountryId = thisMap.ownCountryId;
                    const dbci = userinfo.destoryByCountryIds;
                    console.log('thisCountryId : ', thisCountryId, 'dbci: ', dbci)
                    // dbci 先不用
                    if (thisCountryId && thisCountryId > 0 && memoController.countryMap[thisCountryId]) {
                        const ratio = Math.round(Math.random() * 10) / 10;
                        if (ratio > 0.5) {
                            return asyncUpdateUserInfo(userinfo, { countryId: thisCountryId, role: enums.ROLE_GENERMAN, actPoint: 0 }, act, socket);
                        } else {
                            return asyncUpdateUserInfo(userinfo, { actPoint: 0 }, act, socket);
                        }
                    }
                }
                return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
            }
            case enums.ACT_SEARCH_WILD: {
                const mapId = userinfo.mapNowId;
                const thisMap = memoController.mapIdMap[mapId];
                if (userinfo.actPoint > 0 && userinfo.role !== enums.ROLE_FREEMAN && thisMap && thisMap.type === enums.TYPE_WILD) {
                    const randomMoney = Math.round(Math.random() * 100) + 50;
                    return asyncUpdateUserInfo(userinfo, { money: userinfo.money + randomMoney, actPoint: userinfo.actPoint-1,  }, act, socket);
                }
                return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
            }
            case enums.ACT_INCREASE_SOLDIER: {
                const mapId = userinfo.mapNowId;
                const thisMap = memoController.mapIdMap[mapId];
                if (userinfo.actPoint > 0 && userinfo.role !== enums.ROLE_FREEMAN && thisMap && thisMap.type === enums.TYPE_CITY) {
                    const randomSoldier = Math.round(Math.random() * 200) + 100;
                    return asyncUpdateUserInfo(userinfo, { soldier: userinfo.soldier + randomSoldier, actPoint: userinfo.actPoint-1,  }, act, socket);
                }
                return subEmitMessage(enums.ALERT, {msg: 'Failed.', act});
            }
            
            default:
                console.log("Not Found Act: ", act);
        }
        return null;
    }

    function subEmitMessage(act, payload) {
        emitSocketByte(socket, enums.MESSAGE, {act, payload});
    }
}

module.exports = onMessage