import Vue from 'vue';
import Vuex from 'vuex';
import socketio from 'socket.io-client';
import createSocketIoPlugin from 'vuex-socketio';

import enums from '@/enum';
import mapAlgorithm from '@/helper/mapAlgorithm';
import { arrayBufferToJSON, parseArraiesToObjects } from './parser';
import cusActions from './action';


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
                    mapAlgorithm.setData(state.maps);
                } break;
                case enums.ACT_GET_GLOBAL_CHANGE_DATA: {
                    let dataset = payload.dataset;
                    Array.isArray(dataset) && dataset.map(_ => {
                        let pointer = _.depth.reduce((p, d) => {
                            if (typeof d == 'string') {
                                return p[d];
                            } else if (typeof d == 'number' && p.length > 0) {
                                for (let i = 0; i < p.length; i++) {
                                    if (p[i].id == d) { return p[i]; }
                                }
                            }
                            return {};
                        }, state);
                        console.log('pointer: ', pointer);
                        pointer[_.key] = _.value;
                    });
                } break;
                default:
            }
        },
    },
    actions: {
        wsEmitMessage: ({dispatch, commit}, message) => {
        },
        ...cusActions,
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
