<template>
  <div class="city" @click="$event.stopPropagation()" >
    <div class="city-title">
      {{cityName}} <dd>領地屬性: {{gameTypes.join(', ')}}</dd>
    </div>
    <div class="city-body">
      <div class="city-construct" v-if="citydata">
        <div v-for="(val, key) in citydata.jsonConstruction" :key="`${cityId}${key}`">
          <span><md-icon>house</md-icon>{{transMap[key]}}</span>
          <span>LV: {{val.lv}}</span>
        </div>
      </div>
      <div class="city-info">
        <table style="width: 100%;">
          <tr>
            <th width="50%">總兵力</th>
            <th width="50%">{{userdata.filter(u => u.countryId == mapdata.ownCountryId).reduce((a,b) => a + b.soldier, 0)}}</th>
          </tr>
          <tr v-for="(info, idx) in basicInfos" :key="`${cityId}${idx}`">
            <th v-if="info.common || citydata">{{info.name}}</th>
            <th v-if="info.common || citydata">{{info.formula(info.cons)}}</th>
          </tr>
          <tr>
            <th colspan="2" style="border: 1px solid #d5c905;">所在地將領</th>
          </tr>
          <tr v-for="(uu) in userdata" :key="uu.id" :class="{captived: !!uu.captiveDate}" class="list-people">
            <td>{{getUserOccupation(uu)}}</td>
            <td>
              <li>
                {{uu.nickname}} ( {{uu.soldier}} )
              </li>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import enums from '@/enum'

export default {
  name: 'CityPanel',
  props: {
    cityName: String,
    cityId: Number,
  },
  data() {
    const solidFormula = (x) => {
      const basic = 100 + (this.citydata.jsonConstruction[x].lv * enums.NUM_ADDITIONAL_BARRACK_SOLDIER);
      const max = basic + 200 + (this.global.maps.filter(m => m.ownCountryId == this.mapdata.ownCountryId && m.cityId > 0).length * 15);
      return `${basic} - ${max}`;
    }
    const moneyFormula = (x) => {
      const basic = 50 + this.citydata.addResource + (this.citydata.jsonConstruction[x].lv * enums.NUM_ADDITIONAL_MARKET_MONEY);
      const max = basic + 100;
      return `${basic} - ${max}`;
    }
    return {
      transMap: {
        'barrack': '軍營',
        'market': '市場',
        'stable': '馬廄',
        'wall': '城牆',
      },
      basicInfos: [
        {cons: 'wall', name: '基本抵禦力', common: true, formula: (x) => { return (this.citydata ? this.citydata.jsonConstruction[x].lv * enums.NUM_ADDITIONAL_WALL_TRAPEZOID : 0) + enums.NUM_BATTLE_SOLDIER_MIN; } },
        {cons: 'barrack', name: '徵兵量', common: false, formula: solidFormula},
        {cons: 'market', name: '商業收益', common: false, formula: moneyFormula},
        {cons: 'stable', name: '移動消耗減免', common: false, formula: (x) => { return this.citydata.jsonConstruction[x].lv; }},
        {cons: 'wall', name: '防禦損兵減少量', common: false, formula: (x, c) => { return`${this.citydata.jsonConstruction[x].lv * enums.NUM_ADDITIONAL_WALL_DISCOUNT_DAMAGE_RATIO}%`; }},
      ],
    };
  },
  computed: {
    ...mapState(['global', 'user']),
    citydata(self) {
      return self.global.cities.find(c => c.id == self.cityId);
    },
    mapdata(self) {
      return self.cityId > 0 ? self.global.maps.find(m => m.cityId == self.cityId) : self.global.maps.find(m => m.name == self.cityName);
    },
    userdata(self) {
      // console.log('mapdata: ', self.mapdata);
      const _next = self.global.users.filter(u => u.mapNowId == self.mapdata.id);
      _next.sort((a,b) => {
        const roleGap = a.role - b.role;
        return roleGap == 0 ? b.soldier - a.soldier : roleGap;
      });
      // console.log('userdata: ', _next);
      return _next;
    },
    gameTypes(self) {
      return String(self.mapdata.gameType).split('').map(t => enums.CHINESE_GAMETYPE_NAMES[t]);
    }
  },
  mounted() {
    // console.log('citydata: ', this.citydata);
  },
  methods: {
    getUserOccupation(user) {
      let ext = (user.captiveDate) ? '(俘虜)' : '';
      switch (user.role) {
        case 1: return '主公'+ext
        case 2: {
          const occu = user.occupationId > 0 ? this.global.occupationMap[user.occupationId] : null;
          return (occu ? occu.name : '武將')+ext
        }
        case 3: return '浪人'+ext
        default: return ''
      }
    },
  }
};
</script>

<style lang="scss" scoped>
.city {
  position: relative;
  margin: 120px auto 20px;
  width: 40%;
  height: 60%;
  background-color: #1a1a1a;
  border: 3px outset #d5c905;

  .city-title {
    color: #fff;
    font-size: 32px;
    line-height: 48px;
    border-bottom: 1px solid #d5c905;

    >dd {
      font-size: 14px;
      margin: 0px;
      line-height: 16px;
      color: #bbb;
    }
  }

  .city-body {
    height: calc(100% - 48px);
    overflow: auto;
    color: #fff;
  }

  .city-construct {
    border-bottom: 1px solid #d5c905;
    .md-icon {
      color: #d5c905;
    }
  }

  .list-people {
    white-space: normal;
    color: #fff;
    list-style: none;

    &.captived {
      color: #818181;
    }
  }

  .list-people .plus-point {
    background: #fffdeb;
    color: #b38828;
    font-size: 1.5em;
    border: 1px outset #d5c905;
    width: 20px;
    line-height: 20px;
    display: inline-block;
  }

  .list-people .plus-point:hover {
    color: #fff;
    background: #8b8218;
  }
}

</style>