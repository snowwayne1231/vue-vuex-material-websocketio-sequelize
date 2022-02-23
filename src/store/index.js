import Vue from 'vue';
import Vuex from 'vuex';
import socketio from 'socket.io-client';
import createSocketIoPlugin from 'vuex-socketio';
import enums from '@/enum';
import { arrayBufferToJSON, parseArraiesToObjects } from './parser';
import axios from 'axios';

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
                /*
                    Just for test and demo
                */
                axios.post(wsLocation + 'login', {code: 'R001', pwd: 123, pwdre: 123}).then(e => {
                    const status = e.status; // 200 = 成功  202 = 註冊失敗  203 = 登入失敗
                    console.log(e);
                    if (status == 200) {
                        location.href = '/';
                    }
                });
            }

            const payload = parsedMsg.payload;

            switch (parsedMsg.act) {
                case enums.FAILED: {
                    window.localStorage.removeItem('_token_');
                    return window.alert(parsedMsg.reason);
                }
                case enums.AUTHORIZE: {
                    return Object.keys(payload).map(key => {
                        state[key] = payload[key];
                    });
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
        maps: [],
        cities: [],
        countries: [],
    },
    mutations: {
        wsOnMessage: (state, message) => {
            let parsedMsg = arrayBufferToJSON(message);    // byte array 轉回 json
            clog('Socket On Message Parsed: ', parsedMsg);
            
            const payload = parsedMsg.payload;
            
            switch (parsedMsg.act) {
                case enums.ACT_GET_GLOBAL_DATA: {
                    state.users = parseArraiesToObjects(payload.users, enums.UserGlobalAttributes);
                    state.maps = parseArraiesToObjects(payload.maps, enums.MapsGlobalAttributes);
                    state.cities = parseArraiesToObjects(payload.cities, enums.CityGlobalAttributes);
                    state.countries = parseArraiesToObjects(payload.countries, enums.CountryGlobalAttributes);
                }
                default:
            }
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
