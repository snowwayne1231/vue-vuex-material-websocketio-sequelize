const express = require('express');
const ex_session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs =require('fs');

const app = express();
const http = require('http').createServer(app);
const path = require('path');
// const { Op } = require("sequelize");

const adminbro = require('./admin');
const ws = require('./ws');
const handlers = require('./handler');


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
app.use(express.static(path.join(__dirname, '..', 'dist'), {maxAge: 1000*60*60*24}));
app.use((req, res) => {
    const _ary = req.url.split(/[\/\\]+/g).filter(e=>e.length > 0);
    if (_ary[0] == 'favicon.ico') {
        return res.sendFile(path.join(__dirname, '..', 'static', 'favicon.ico'));
    }
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
    const _to = uris[0];

    if (_to == 'logout') {
        // 登出
        return handlers.logoutByRequestResponse(req, res);
    }

    if (req.method=='POST') {
        return handlers.handlePOST(req, res, _to);
    }

    if (uris.length < 2) {
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


