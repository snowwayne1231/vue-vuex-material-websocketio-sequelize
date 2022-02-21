import Vue from 'vue';
import Vuex from 'vuex';
import socketio from 'socket.io-client';
import createSocketIoPlugin from 'vuex-socketio';
import enums from '@/enum';
import { arrayBufferToJSON } from './parser';

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
        wsOnMessage: (state, message) => {
            let parsed_msg = arrayBufferToJSON(message);
            clog('Socket On Message Parsed: ', parsed_msg);
            if (message.redirect) {
                window.location.href = message.redirect;
                return;
            }
            const payload = message.payload;
            
            switch (message.act) {
                case enums.AUTHORIZE: {
                    Object.keys(payload).map(key => {
                        state[key] = payload[key];
                    });
                    return false;
                }
                default:
            }
        },
    },
    actions: {
        wsEmitMessage: (context, message) => {
        },
        wsEmitAuthorize: (context, message) => {
        },
    },
    getters: {
        
    },
}

const globalData = {
    state: {
        users: [],
    },
    mutations: {
        wsOnMessage: (state, message) => {
            const payload = message.payload;
            
        },
    },
    getters: {
        
    }
};


export default new Vuex.Store({
    modules: {
      'user': moduleUser,
      'global': globalData,
    },
    plugins: [socketPlugin]
});
