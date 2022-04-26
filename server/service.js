const express = require('express');
const ex_session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs =require('fs');

const app = express();
const http = require('http').createServer(app);
const path = require('path');
// const { Op } = require("sequelize");
// pares command line parameter
const argvv = process.argv.slice(2);
const whiteIps = ['172.16.2.111', '127.0.0.1'];
let port = 81;
let isEnvDev = true;

if (argvv.length > 0) {
    argvv.forEach((a, idx) => {
        switch (idx) {
            case 0:
                port = parseInt(a);
                break
            case 1:
                process.env.NODE_ENV = `${a}`;
                isEnvDev = a == 'development';
                break
            default:
        }
    });
}
//
console.log('NODE_ENV : ', process.env.NODE_ENV, '  isEnvDev: ', isEnvDev);

const adminbro = require('./admin');
const ws = require('./ws');
const handlers = require('./handler');

app.engine('ejs', require('ejs').renderFile);
app.set('trust proxy', 1);
app.use(cors());

const session_middleware = ex_session({
    secret: '_se_secret_',
    name: '_se_tls_', 
    cookie: { maxAge: 8 * 60 * 60 * 1000 }, // ms
    resave: false,
    saveUninitialized: true,
});
app.use(session_middleware);
// setting http service
if (port == 81) {
    adminbro.useAdminRouterDev(app);
    app.use(express.static(path.join(__dirname, '..', '/'), {maxAge: 1000*5}));
} else {
    adminbro.useAdminRouter(app);
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const productKeyword = 'welfare22';
const staticFrontendDirectory = (port > 20000) ? path.join(__dirname, '..', 'dist', 'welfare22') : path.join(__dirname, '..', 'dist', 'welfare22-qa');
// app.use((req, res) => { // for static frontend 
//     console.log('req.url: ', req.url);
//     res.status(203).send('qq.');
//     return res;
// });
if (isEnvDev) {
    app.use('/', express.static(path.join(__dirname, '..', 'maintain'), {maxAge: 1000*60*60}));
} else {
    app.use('/' + productKeyword, express.static(staticFrontendDirectory, {maxAge: 1000*60*60*24}));
    app.use(express.static(staticFrontendDirectory, {maxAge: 1000*60*60}));
}
app.use(express.static(path.join(__dirname, '..', 'dist'), {maxAge: 1000*60*60*24}));
app.use((req, res) => { // basic 
    const _ary = req.url.split(/[\/\\]+/g).filter(e=>e.length > 0);
    return renderURI(req, res, _ary);
});
ws.buildWsConnection(http, session_middleware);


// listen service by port
http.listen(port, () => {
    console.log('listening on *: ' + port);
});
//


function renderURI(req, res, uris) {
    const userinfo = req.session.userinfo || {};
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 
    const _to = uris[0];
    
    if (isEnvDev && whiteIps.findIndex(w => ip.match(new RegExp(w, 'g')))<0) {
        console.log('Not Allowed ip: ', ip);
        return res.status(403).send('Not Allowed.');
    }

    if (_to == 'logout') {
        // 登出
        return handlers.logoutByRequestResponse(req, res);
    }

    if (req.method=='POST') {
        return handlers.handlePOST(req, res, _to, ws);
    }

    if (uris.length < 2 && _to == 's') {
        if (userinfo && userinfo.id) {
            handlers.renderIndex(res);
        } else {
            handlers.renderLogin(res);
        }
    } else {
        res.status(404).send('Not Found.');
    }
    return res
}


