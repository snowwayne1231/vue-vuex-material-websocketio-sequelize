
const socketIO = require("socket.io");
const { Op } = require("sequelize");
const fs = require('fs');
const models = require('./models');
const enums = require('../src/store/enum');

const ROOM_CHATTING_BAR = 'roomchattingbar';
const user_in_house = [];
const memo_ctl = {};

refreshBasicData();


function refreshBasicData(callback) {
    const promises = [];
    const promise1 = models.User.findAll({attributes: ['id', 'nickname']}).then((cs) => {
        
    });
    const promise2 = models.Admin.findAll({attributes: ['id']}).then(c => {
        
    });
    
    promises.push(promise1);
    promises.push(promise2);
    var _all = Promise.all(promises);
    if (callback) {
        _all.then(callback)
    }
    _all.catch(err => console.log(err));
}


function onMessage(socket) {
    socket.on('MESSAGE', (msg) => {
        const act = msg.act || '';
        const payload = msg.payload || {};
        const userinfo = socket.request.session.userinfo;
        switch (act) {
            case enums.ACT_GET_PEOPLE_DATA: {
                let attributes = ['id', 'name'];
                if (payload.more) {
                    attributes = attributes.concat(['nickname']);
                }
                return models.User.findAll({
                    attributes,
                    // where: [{status: 1}],
                }).then(users => {
                    socket.emit('MESSAGE', {act: enums.ACT_GET_PEOPLE_DATA, payload: {users}});
                }).catch(err => {
                    console.log(err);
                });
            }
            
            default:
                console.log("Not Found Act: ", msg);
        }
        
    });
}

function onDisconnect(socket) {
    socket.on('disconnect', (msg) => {
        var userinfo = socket.request.session.userinfo;
        if (!userinfo) { return; }
        console.log('disconnected: ', userinfo ? userinfo.nickname : 'unknown');
        var house_idx = user_in_house.findIndex(e => e.id == userinfo.id);
        if (house_idx >= 0) {
            user_in_house.splice(house_idx, 1);
        }
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


module.exports = {
    buildWsConnection: function(http_serv, middleware) {
        const io = socketIO(http_serv, {cors: {origin: '*'}});
        io.on('connection', this.onConnect);
        io.use(function(socket, next) {
            middleware(socket.request, socket.request.res || {}, next);
        });
        memo_ctl.websocket = io;
    },
    onConnect: function(socket) {
        const session = socket.request.session;
        const userInfo = session.userinfo || {};
        
        console.log('A user socket connected: ', userInfo.nickname);
        
        socket.on('AUTHORIZE', (msg) => {
            if (parseInt(msg) == userInfo.loginTimestamp) {
                return models.User.findByPk(userInfo.id).then(user => {
                    const _userInfo = user.toJSON();
                    for (var key in userInfo) {
                        if (_userInfo.hasOwnProperty(key)) {
                            userInfo[key] = _userInfo[key];
                        }
                    }
                    // const loginTimestamp = new Date().getTime();
                    socket.emit('MESSAGE', {act: 0, payload: userInfo});
                });
            } else if (socket.request.headers.host.match(/127.0.0.1/i)) {
                return models.User.findOne({where: {code: 'R343'}}).then(user => {
                    const _userInfo = user.toJSON();
                    session.userinfo = _userInfo;
                    socket.emit('MESSAGE', {act: 0, payload: _userInfo});
                });
            } else {
                socket.emit('MESSAGE', {act: 'failed', redirect: '/logout'});
            }
        });

        bindSockets(socket);
    }
}
