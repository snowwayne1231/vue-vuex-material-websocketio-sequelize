<template>
  <div class="home">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>RANK PEOPLE API</span>
            <!-- <button @click="saveLocalOcc">Save Occ</button>
            <button @click="onClickRecovry">*Recovry*</button> -->
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        <div class='rank-content'>
          <table class="rank-table-api">
            <thead>
              <tr>
                <th>國家</th>
                <th>暱稱</th>
                <th>貢獻</th>
                <th>建築次數</th>
                <th>建築詳情</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="loc in apiDatas" :key="loc.id">
                <td :style="`color: ${loc.country.color[1]}; backgroundColor: ${loc.country.color[0]};`">{{loc.country ? loc.country.name : 'none'}}</td>
                <td>{{loc.nickname}}</td>
                <td>{{loc.contribution}}</td>
                <td>{{loc.data.total}}</td>
                <td><ul>
                  <li v-for="(api, idx) in loc.data.apis" :key="idx">{{api}}</li>
                </ul></td>
              </tr>
            </tbody>
          </table>
        </div>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'RankPeopleApi',
  data() {
    return {
      localSorted: [],
    }
  },
  components:{
    
  },
  computed: {
    ...mapState(['global', 'user']),
    userMap() {
      const map = {};
      this.global.users.filter(user => user.mapNowId > 0).map(user => {
        map[user.id] = user;
      });
      return map;
    },
    apiHashUserMap() {
      const _rgexp = /([\S]+?)\s將\s([\S]+?)的([\S]+?)\s升級至\s(.*?)$/;
      const mapUserNicknameId = {};
      const map = {};
      this.global.users.map(user => {
        map[user.id] = {
          total: 0,
          barrack: 0,
          market: 0,
          stable: 0,
          wall: 0,
          apis: [],
        };
        mapUserNicknameId[user.nickname] = user.id
      });
      console.log('apiHashUserMap: ', this.global.results);
      
      this.global.results.map(api => {
        const timestamp = api.timestamp;
        let detail = api.detail;
        // const countryId = api.countryId;
        if (typeof detail != 'string') { return false }
        if (detail.substr(0, 4) != '【內政】') { return true }
        detail = detail.substr(4);
        const matched = detail.match(_rgexp);
        if (matched) {
          const nickname = matched[1];
          const city = matched[2];
          const target = matched[3];
          const lv = matched[4];
          const uid = mapUserNicknameId[nickname];
          if (map[uid]) {
            map[uid].apis.push(detail);
            map[uid].total += 1;
          }
        }
        // "【內政】何噠噠 將 漢中的市場 升級至 Lv( 1 )"
        
      });
      // Object.keys(map).map(key => {
      //   map[key].total = map[key].atk + map[key].def;
      // })
      return map;
    },
    countryMap() {
      const map = {};
      this.global.countries.map(country => {
        const next = {...country};
        next.color = typeof country.color == 'string' ? country.color.split(',') : country.color;
        map[next.id] = next;
      });
      return map
    },
    apiDatas() {
      const userMap = this.userMap;
      const apiHashUserMap = this.apiHashUserMap;
      const countryMap = this.countryMap;
      
      const results = Object.values(userMap).map(user => {
        user.data = apiHashUserMap[user.id] || {};
        user.country = countryMap[user.countryId] || {color: ['#bbb', '#444'], name: '浪'};
        return user;
      });
      results.sort((a,b) => {
        const gapnum = b.data.total - a.data.total;
        // return gapnum == 0 ? b.data.win - a.data.win : gapnum;
        return gapnum;
      });
      
      return results;
    },
  },
  mounted() {
    if (!['R343', 'R307', 'R064', 'R001'].includes(this.user.code)) {
      window.alert('福委用的');
      return this.$router.push('/');
    }

    this.$store.dispatch('wsEmitADMINCTL', {model: 'RecordEventDomestic', where: {}, attributes: {}});
  },
  methods: {
    
  },
}
</script>

<style lang="scss">
.rank-content {
  position: relative;
  overflow: auto;
  max-height: 86vh;

  .rank-table-api {
    width: 100%;

    tr:nth-child(even) {
      background-color: #eee;
    }

    th {
      font-weight: 700;
      text-shadow: 1px 0px 1px #222;
      border: 1px solid #ccc;
    }
    td {
      vertical-align: top;
      ul {
        list-style: none;
        padding: 0px;
        margin: 0px;
        li {
          border: none;
        }
      }
      span {
        display: block;
        height: 22px;
        line-height: 20px;
      }
    }
  }

  
}
</style>