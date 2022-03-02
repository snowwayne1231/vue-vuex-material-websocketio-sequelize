const models = require('./models');
const md5 = require('md5');
const path = require('path');
const fs =require('fs');

// render and handle the uri
var _index = path.join(__dirname, '..', 'dist', 's.ejs');
if (!fs.existsSync(_index)) {
    _index = path.join(__dirname, '..', 's.ejs');
}
const _login = path.join(__dirname, 'login.ejs');


module.exports = {
    renderIndex: function(res) {
        return res.render(_index);
    },
    renderLogin: function(res, objects = {}) {
        const template = {msg: '', register: false};
        return res.render(_login, {...template, ...objects});
    },
    logoutByRequestResponse: function(req, res) {
        req.session = null;
        res.clearCookie('_se_tls_');
        res.clearCookie('_logintimestamp_');
        return res.redirect('/');
    },
    asyncLogin: async function(code, pwd) {
        const loginTimestamp = new Date().getTime();
        const user = await models.User.findOne({
            attributes: ['id', 'nickname', 'pwd', 'code'],
            where: { code: code }
        });

        if (user) {
            const user_data = user.toJSON();
             if (user_data.pwd == '') {
                return {done: false, register: true};
            } else if (user_data.pwd == md5(String(pwd))) {
                // 登錄
                return {done: true, msg: '', data: {
                    ...user_data,
                    loginTimestamp,
                }};
            } else {
                // 登錄失敗
                return {done: false, msg: 'Login Failed, Password Wrong.', register: false};
            }
        } else {
            return {done: false, msg: 'Login Failed, Not Exist Code.', register: false};
        }
    },
    asyncRegister: async function(code, pwd, pwdre) {
        const isConfirmed = pwd == pwdre;
        if (isConfirmed) {
            const user = await models.User.findOne({
                attributes: ['id', 'nickname', 'pwd', 'code'],
                where: { code: code }
            });
            user.pwd = md5(pwd);
            await user.save();
            return {done: true};
        } else {
            return {done: false, msg: 'Password has difference.', register: true};
        }
    },
    handlePOST: function(req, res, where) {
        // const ifLocal = req.headers.host.match(/127.0.0.1/i);
        const _body = req.body;
        switch (where) {
            case 'login': {
                const code = String(_body.code || '').trim();
                const pwd = String(_body.pwd || '').trim();
                const isRegister = _body.pwdre && String(_body.pwdre).length > 0;
                const pwdre = isRegister ? String(_body.pwdre).trim() : '';

                console.log('code: ', code);
                console.log(_body);

                if (isRegister) {
                    return this.asyncRegister(code, pwd, pwdre).then(payload => {
                        if (payload.done) {
                            res.redirect('/');;
                        } else {
                            res.status(202);
                            this.renderLogin(res, payload);
                        }
                    });
                } else {
                    return this.asyncLogin(code, pwd).then(payload => {
                        if (payload.done) {
                            req.session.userinfo = payload.data;
                            res.cookie('_logintimestamp_', payload.data.loginTimestamp);
                            res.redirect('/s');
                        } else {
                            res.status(203);
                            this.renderLogin(res, payload);
                        }
                    });
                }
            }
            default:
                res.status(404).send('Wrong Parameter.');
        }
        return res;
    },
};