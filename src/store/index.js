import Vue from 'vue';
import Vuex from 'vuex';
import socketio from 'socket.io-client';
import createSocketIoPlugin from 'vuex-socketio';

import enums from '@/enum';
import { arrayBufferToJSON } from './parser';
import cusActions from './action';
import global from './global';


console.log('process.env: ', process.env);
const wsLocation = process.env.WS_LOCATION;
const socket = socketio(wsLocation);
const socketPlugin = createSocketIoPlugin(socket, {
    onPrefix: 'wsOn',
    emitPrefix: 'wsEmit',
});

Vue.use(Vuex);

const userInitState = {
    id: 0,
    code: '',
    nickname: '',
    nameZh: '',
    nameEn: '',
    countryId: 0,
    loyalUserId: 0,
    loyalty: 0,
    contribution: 0,
    occupationId: 0,
    role: 0,
    money: 0,
    actPoint: 0,
    actPointMax: 0,
    mapTargetId: 0,
    mapNowId: 0,
    mapNextId: 0,
    mapPathIds: [],
    destoryByCountryIds: [],
    soldier: 0,
    captiveDate: 0,
    connected: false,
    location: wsLocation,
};

const moduleUser = {
    state: {...userInitState},
    mutations: {
        wsOnConnect: (state) => {
            state.connected = true;
        },
        wsOnDisconnect: (state) => {
            state.connected = false;
        },
        wsOnAuthorize: (state, message) => {
            let parsedMsg = arrayBufferToJSON(message);    // byte array 轉回 json
            clog('Socket On Authorize Parsed: ', parsedMsg);
            if (parsedMsg.redirect) {
                window.location.href = parsedMsg.redirect;
                return;
            }
            if (parsedMsg.token) {
                window.localStorage.setItem('_token_', parsedMsg.token);
            }
            if (parsedMsg.register) {
                
            }

            const payload = parsedMsg.payload;

            switch (parsedMsg.act) {
                case enums.FAILED: {
                    window.localStorage.removeItem('_token_');
                    return window.alert(parsedMsg.reason);
                }
                case enums.AUTHORIZE:
                default:
                    return Object.keys(payload).map(key => {
                        state[key] = payload[key];
                    });
            }
        },
    },
    actions: {
        wsEmitAuthorize: (context, message) => {
        },
    },
    getters: {
        
    },
}

export default new Vuex.Store({
    modules: {
      'user': moduleUser,
      global,
    },
    plugins: [socketPlugin]
});
