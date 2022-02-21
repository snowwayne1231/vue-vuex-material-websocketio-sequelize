
const socketIO = require("socket.io");
const { Op } = require("sequelize");
const fs = require('fs');
const models = require('./models');
const enums = require('../src/enum');

const ROOM_CHATTING_BAR = 'roomchattingbar';
const memo_ctl = {websocket: null, userMap: {}};






function onMessage(socket) {

    socket.on(enums.MESSAGE, (msg) => {
        const act = msg.act || '';
        const payload = msg.payload || {};
        const userinfo = socket.request.session.userinfo;
        let switched = subSwitchOnMessage(act, payload, userinfo);
        return switched && switched.catch(err => console.log(err));
    });


    function subSwitchOnMessage(act, payload, userinfo) {
        switch (act) {
            case enums.ACT_GET_USERS_INFO: {
                let userGlobalAttributes = ['id', 'code', 'nickname', 'countryId', 'loyalty', 'contribution', 'occupationId', 'role', 'mapNowId', 'soldier', 'captiveDate'];
                let users = [];
                return emitSocketByte(socket, enums.MESSAGE, {act: enums.ACT_GET_USERS_INFO, payload: {users}});
                
            }
            
            default:
                console.log("Not Found Act: ", act);
        }
        return null;
    }
}





function onDisconnect(socket) {
    socket.on('disconnect', (msg) => {
        var userinfo = socket.request.session.userinfo;
        if (!userinfo) { return; }
        console.log('disconnected: ', userinfo ? userinfo.nickname : 'unknown');
    });
}





function bindSockets(socket) {
    onMessage(socket);
    onDisconnect(socket);
}





function broadcastChatRoom(obj) {
    return memo_ctl.websocket.to(ROOM_CHATTING_BAR).emit('MESSAGE', obj);
}

function broadcast(obj) {
    return memo_ctl.websocket.emit('MESSAGE', obj);
}







function refreshBasicData(callback) {
    const promises = [];
    const promise1 = models.User.findAll({attributes: {exclude: ['pwd', 'createdAt']}}).then((users) => {
        users.map(user => {
            let _user = user.toJSON();
            _user = parseJson(_user, ['mapPathIds', 'destoryByCountryIds']);
            memo_ctl.userMap[user.id] = _user;
        });
    });
    promises.push(promise1);
    var _all = Promise.all(promises);
    if (callback) {
        _all.then(callback);
    }
    return _all;
}



function parseJson(obj, keys = []) {
    keys.forEach(key => {
        let _loc = obj[key];
        if (typeof _loc == 'string') {
            obj[key] = _loc.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(_loc) : JSON.parse(_loc);
        }
    });
    return obj;
}



function emitSocketByte(socket, frame, data) {
    var buf = Buffer.from(JSON.stringify(data), 'utf-8');
    console.log('JSON.stringify(data) length: ', JSON.stringify(data).length);
    socket.emit(frame, buf);
}


module.exports = {
    buildWsConnection: function(http_serv, middleware) {
        const io = socketIO(http_serv, {cors: {origin: '*'}});
        const onConn = this.onConnect;
        memo_ctl.websocket = io;
        refreshBasicData().then(() => {
            memo_ctl.websocket.on('connection', onConn);
            memo_ctl.websocket.use(function(socket, next) {
                middleware(socket.request, socket.request.res || {}, next);
            });
        });
    },
    onConnect: function(socket) {
        const session = socket.request.session;
        const userInfo = session.userinfo || {};
        
        console.log('A user socket connected: ', userInfo.nickname);

        socket.on(enums.AUTHORIZE, (msg) => {
            if (parseInt(msg) == userInfo.loginTimestamp) {
                let fullUserInfo = memo_ctl.userMap[userInfo.id];
                return socket.emit('MESSAGE', {act: enums.AUTHORIZE, payload: fullUserInfo});
            } else if (socket.request.headers.host.match(/127.0.0.1|localhost/i)) {
                return models.User.findOne({where: {code: 'R307'}, attributes: {exclude: ['pwd', 'createdAt']}}).then(user => {
                    let _userInfo = user.toJSON();
                    _userInfo = parseJson(_userInfo, ['mapPathIds', 'destoryByCountryIds']);
                    session.userinfo = _userInfo;
                    // socket.emit('MESSAGE', {act: enums.AUTHORIZE, payload: _userInfo});
                    emitSocketByte(socket, 'MESSAGE', {act: enums.AUTHORIZE, payload: _userInfo})
                });
            } else {
                socket.emit('MESSAGE', {act: 'failed', redirect: '/logout'});
            }
        });

        bindSockets(socket);
    }
}
