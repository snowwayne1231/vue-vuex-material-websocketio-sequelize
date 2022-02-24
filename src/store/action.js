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
    register,
}