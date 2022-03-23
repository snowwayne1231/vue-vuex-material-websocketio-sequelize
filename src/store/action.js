const axios = require('axios');
const enums = require('@/enum');
const wsLocation = process.env.WS_LOCATION;
function register() {
    let code = window.prompt('輸入工號');
    let pwd = window.prompt('輸入密碼');
    return axios.post(wsLocation + 'login', {code, pwd, pwdre: pwd}).then(e => {
        const status = e.status; // 200 = 成功  202 = 註冊失敗  203 = 登入失敗
        if (status == 200) {
            location.href = '/';
        } else {
            window.alert('註冊失敗');
        }
    });
}



module.exports = {
    actMove: ({dispatch}, args) => {
        dispatch('wsEmitMessage', {act: enums.ACT_MOVE, payload: args});
    },
    actIncreaseSoldier: ({dispatch}) => {
        dispatch('wsEmitMessage', {act: enums.ACT_INCREASE_SOLDIER});
    },
    actSearchWild: ({dispatch}) => {
        dispatch('wsEmitMessage', {act: enums.ACT_SEARCH_WILD});
    },
    actLeaveCountry: ({dispatch}) => {
        dispatch('wsEmitMessage', {act: enums.ACT_LEAVE_COUNTRY});
    },
    actEnterCountry: ({dispatch}) => {
        dispatch('wsEmitMessage', {act: enums.ACT_ENTER_COUNTRY});
    },
    actBattle: ({dispatch}, args) => {
        dispatch('wsEmitMessage', {act: enums.ACT_BATTLE, payload: args});
    },
    actBattleJoin: ({dispatch}, args) => {
        dispatch('wsEmitMessage', {act: enums.ACT_BATTLE_JOIN, payload: args});
    },
    actBattleJudge: ({dispatch}, args) => {
        dispatch('wsEmitMessage', {act: enums.ACT_BATTLE_JUDGE, payload: args});
    },
    actBusiness: ({dispatch}) => {
        dispatch('wsEmitMessage', {act: enums.ACT_BUSINESS});
    },
    actAppointOccupation: ({dispatch}, args) => {
        dispatch('wsEmitMessage', {act: enums.ACT_APPOINTMENT, payload: args});
    },
    actDismissOccupation: ({dispatch}, args) => {
        dispatch('wsEmitMessage', {act: enums.ACT_DISMISS, payload: args});
    },
    actLevelUpCity: ({dispatch}, args) => {
        dispatch('wsEmitMessage', {act: enums.ACT_LEVELUP_CITY, payload: args});
    },
    register,
}