import parser from './parser'
import algorithm from '@/unit/mapAlgorithm'
import enums from '@/enum'
import actions from './action'

const global = {
  state: {
    users: [],
    maps: [],
    cities: [],
    countries: []
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
          algorithm.setData(state.maps)
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
              if (pointer[key]) { pointer[key] = value }
            });
          })
        } break
        default:
      }
    }
  },
  actions: {
    wsEmitMessage: () => {

    },
    ...actions
  },
  getters: {
  }
}

export default global
