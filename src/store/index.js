import Vue from 'vue';
import Vuex from 'vuex';
import socketio from 'socket.io-client';
import createSocketIoPlugin from 'vuex-socketio';


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
    name: '',
    nickname: '',
    departmentName: '',
    lastName: '',
    firstName: '',
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
            if (message.redirect) {
                window.location.href = message.redirect;
                return;
            }
            const payload = message.payload;
            // switch (message.act) {
            //     case 1:  break;
            //     default:
            // }
        },
    },
    actions: {
        
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

const moduleGame = {
    state: {
        results: [],
        list: [],
    },
    mutations: {
        wsOnMessage: (state, message) => {
            const payload = message.payload;
            
        },
    },
}

export default new Vuex.Store({
    modules: {
      'user': moduleUser,
      'global': globalData,
      'game': moduleGame,
    },
    plugins: [socketPlugin]
});
