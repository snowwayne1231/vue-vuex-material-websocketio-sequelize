import parser from './parser'
import algorithm from '@/unit/mapAlgorithm'
import enums from '@/enum'
import actions from './action'

const global = {
  state: {
    users: [],
    maps: [],
    cities: [],
    countries: [],
    warRecords: [],
    battlefieldMap: {/*0: {id: 0, attackCountryIds: [], defenceCountryId: 0, detail: {}, judgeId: 0, mapId: 0, round: 0, timestamp: 0, winnerCountryId: 0}*/},
    occupationMap: {/*0: {id: 0, name: '', contributionCondi: 999, addActPoint: 5, isAllowedRecurit: false, isAllowedShare: false}*/},
    gameMap: {/*0: {id: 0, name: '', type: 0, b1v1: true, b2v2: false, b3v3: false, b4v4: false,..} */},
    notifications: [],
    domesticMessages: [],

    battlefield: {
      timeOptions: [],
      mapId: 0,
    },
    battleRecordDetails: {
      id: 0,
    },
    rewards: [],
    results: [],
  },
  mutations: {
    wsOnMESSAGE: (state, message) => {
      const parsedMsg = parser.arrayBufferToJSON(message)
      console.log('Socket On Message Parsed: ', parsedMsg)
      const payload = parsedMsg.payload
      switch (parsedMsg.act) {
        case enums.ACT_GET_GLOBAL_DATA:
          state.users = parser.parseArraiesToObjects(payload.users, enums.UserGlobalAttributes)
          state.maps = parser.parseArraiesToObjects(payload.maps, enums.MapsGlobalAttributes)
          state.cities = parser.parseArraiesToObjects(payload.cities, enums.CityGlobalAttributes)
          state.countries = parser.parseArraiesToObjects(payload.countries, enums.CountryGlobalAttributes)
          state.warRecords = parser.parseArraiesToObjects(payload.warRecords, enums.WarRecordGlobalAttributes)
          state.warRecords.sort((a,b) => b.id - a.id)
          algorithm.setData(state.maps)
          if (payload.notifications) {
            state.notifications = payload.notifications.map(e => [new Date(e[0]), e[1]]);
            state.notifications.sort((a,b) => b[0] - a[0]);
          }
          if (payload.domesticMessages) {
            state.domesticMessages = payload.domesticMessages.map(e => [new Date(e[0]), e[1]]);
            state.domesticMessages.sort((a,b) => b[0] - a[0]);
          }
          if (payload.battlefieldMap) {
            state.battlefieldMap = payload.battlefieldMap;
          }
          if (payload.occupationMap) {
            state.occupationMap = payload.occupationMap;
          }
          if (payload.gameMap) {
            state.gameMap = payload.gameMap;
          }
          break
        case enums.ACT_GET_GLOBAL_CHANGE_DATA: {
          const dataset = payload.dataset
          Array.isArray(dataset) && dataset.map(_ => {
            const pointer = _.depth.reduce((p, d) => {
              if (typeof d === 'string') {
                return p[d]
              } else if (typeof d === 'number' && p.length > 0) {
                for (let i = 0; i < p.length; i++) {
                  if (p[i].id === d) { return p[i] }
                }
              }
              return {}
            }, state)
            console.log('pointer: ', pointer, 'update: ', _.update)
            Object.keys(_.update).map(key => {
              const value = _.update[key];
              if (pointer.hasOwnProperty(key)) { pointer[key] = value }
            });
          })
        } break
        case enums.ACT_GET_GLOBAL_USERS_INFO: {
          state.users = parser.parseArraiesToObjects(payload.users, enums.UserGlobalAttributes)
        } break
        case enums.ACT_NOTIFICATION: {
          const new_noti = [new Date(payload[0]), payload[1]]
          state.notifications = [new_noti].concat(state.notifications);
        } break
        case enums.ACT_BATTLE: {
          const timeOptions = payload.options;
          const mapId = payload.mapId;
          if (timeOptions) {
            state.battlefield.timeOptions = timeOptions;
            state.battlefield.mapId = mapId;
          } else {
            state.battlefield.timeOptions = [];
            state.battlefield.mapId = 0;
          }
        } break
        case enums.ACT_BATTLE_ADD: {
          const mapId = payload.mapId;
          const nextBattlefield = { ...state.battlefieldMap };
          nextBattlefield[mapId] = payload.jsondata;
          state.battlefieldMap = nextBattlefield;
        } break
        case enums.ACT_BATTLE_DONE: {
          const mapId = payload.mapId;
          const nextBattlefield = { ...state.battlefieldMap };
          delete nextBattlefield[mapId];
          state.battlefieldMap = nextBattlefield;
          state.warRecords = state.warRecords.concat([payload]);
          state.warRecords.sort((a,b) => b.id - a.id);
        } break
        case enums.ACT_NOTIFICATION_DOMESTIC: {
          const newmsg = [new Date(payload[0]), payload[1]]
          state.domesticMessages = [newmsg].concat(state.domesticMessages);
        } break
        case enums.ACT_BATTLE_GAME_SELECTED: {
          const mapId = payload.mapId;
          const gameId = payload.gameId;
          const nextBattlefield = { ...state.battlefieldMap };
          nextBattlefield[mapId].gameId = gameId;
          state.battlefieldMap = nextBattlefield;
        } break
        case enums.ACT_GET_BATTLE_DETAIL: {
          state.battleRecordDetails = payload;
        } break
        case enums.ACT_RAISE_COUNTRY: {
          const newCountry = payload.newCountry;
          const mapId = payload.mapId;
          const gameType = payload.gameType;
          const idx = state.maps.findIndex(m => m.id == mapId);
          state.maps[idx].gameType = gameType;
          state.maps[idx].ownCountryId = newCountry.id;
          const newCountries = state.countries.slice();
          newCountries.push(newCountry);
          state.countries = newCountries;
        } break
        case enums.ADMIN_CONTROL: {
          console.log(payload);
        } break
        case enums.ALERT: {
          let errorMsg =payload.msg;
          if (payload.act == enums.ACT_BATTLE && payload.deadline) {
            errorMsg = `${payload.map} 正在修整剛佔領的據點 於 ${new Date(payload.deadline).toLocaleString()} 修整完畢`;
          }
          window.alert(errorMsg);
        }
        default:
      }
    },
    updateGlobal: (state, args) => {
      Object.keys(args).map(key => {
        let val = args[key];
        if (state.hasOwnProperty(key)) {
          state[key] = val;
        }
      });
    },
  },
  actions: {
    wsEmitMessage: () => {
    },
    wsEmitADMINCTL: () => {
    },
    wsOnADMINCTL: (content, buffer) => {
      const msg = parser.arrayBufferToJSON(buffer);
      console.log('msg: ' , msg);
      switch (msg.model) {
        case 'Reward': {
          if (Array.isArray(msg.data)) {
            content.commit('updateGlobal', {
              rewards: msg.data
            });
          } else if (msg.id > 0) {
            const nextRewards = content.state.rewards.slice();
            nextRewards.push(msg.data);
            content.commit('updateGlobal', {
              rewards: nextRewards,
            });
          }
        } break
        default:
          if (Array.isArray(msg.data)) {
            content.commit('updateGlobal', {
              results: msg.data,
            });
          }
      }
    },
    ...actions
  },
  getters: {
  }
}

export default global
