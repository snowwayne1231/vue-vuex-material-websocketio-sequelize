const express = require('express');
const ex_session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const http = require('http').createServer(app);
const path = require('path');
// const io = require("socket.io")(http, {cors: {origin: '*'}});
const md5 =require("md5");
const { Op } = require("sequelize");

const adminbro = require('./admin');
const models = require('./models');

const ws = require('./ws');


// pares command line parameter
const argvv = process.argv.slice(2);
let port = 81;
if (argvv.length > 0) {
    argvv.forEach(a => {
        let integer = parseInt(a);
        if (integer > 0) {
            port = integer;
        }
    });
}
//


// setting http service
if (port == 81) {
    adminbro.useAdminRouterDev(app);
} else {
    adminbro.useAdminRouter(app);
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.engine('ejs', require('ejs').renderFile);
app.set('trust proxy', 1);

const session_middleware = ex_session({
    secret: '_se_secret_',
    name: '_se_tls_', 
    cookie: { maxAge: 8 * 60 * 60 * 1000 }, // ms
    resave: false,
    saveUninitialized: true,
});
app.use(session_middleware);
app.use(express.static(path.join(__dirname, '..', 'dist'), {maxAge: 1000*60*60*24}));
app.use((req, res) => {
    const _ary = req.url.split(/[\/\\]+/g).filter(e=>e.length > 0);
    if (_ary[0] == 'favicon.ico') {
        return res.sendFile(path.join(__dirname, '..', 'static', 'favicon.ico'));
    }
    return renderURI(req, res, _ary);
});
//

ws.buildWsConnection(http, session_middleware);


// listen service by port
http.listen(port, () => {
    console.log('listening on *: ' + port);
});
//



// render and handle the uri
const _index = path.join(__dirname, '..', 'dist', 'index.ejs');
const _login = path.join(__dirname, 'login.ejs');

function renderURI(req, res, uris) {
    const userinfo = req.session.userinfo || {};

    if (uris[0] == 'logout') {
        // 登出
        req.session = null;
        res.clearCookie('_se_tls_');
        res.clearCookie('_logintimestamp_');
        return res.redirect('/');
    }
    
    if (req.method=='POST') {
        return handlePOST(req, res, uris);
    }

    if (uris.length < 2) {
        // console.log('userinfo');
        // console.log(userinfo);
        if (userinfo && userinfo.id) {
            // res.sendFile(_html);
            res.render(_index, {userinfo});
        } else {
            res.render(_login, {msg: ''});
        }
    } else {
        res.status(404).send('Not Found.');
    }
    return res
}


function handlePOST(req, res, uris) {
    const ifLocal = req.headers.host.match(/127.0.0.1/i);
    const _body = req.body;
    // console.log('handlePOST req: ', req.body);
    if (uris[0] == 'login') {
        const code = _body.code.trim();
        const pwd = md5(_body.pwd.trim());
        models.User.findOne({
            where: { code: code }
        }).then(user => {
            const user_data = user.toJSON();
            // console.log(user_data)
            if (user_data.pwd == pwd || ifLocal) {
                // 登錄
                const loginTimestamp = new Date().getTime();
                req.session.userinfo = {
                    ...user_data,
                    loginTimestamp,
                };
                res.cookie('_logintimestamp_', loginTimestamp);
                res.redirect('/');
            } else {
                // 登錄失敗
                res.render(_login, {msg: 'Login Failed, Password Wrong.'});
            }
        }).catch(e => {
            res.render(_login, {msg: 'Login Failed, Code Wrong.'});
        })
    } else {
        res.status(404).send('Wrong Parameter.');
    }
    return res;
}


