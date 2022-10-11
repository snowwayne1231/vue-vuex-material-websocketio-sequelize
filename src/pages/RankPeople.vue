<template>
  <div class="home">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>RANK PEOPLE DATA</span>
            <!-- <button @click="saveLocalOcc">Save Occ</button>
            <button @click="onClickRecovry">*Recovry*</button> -->
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        <div class='rank-content'>
          <table class="rank-table">
            <thead>
              <tr>
                <th>國家</th>
                <th>暱稱</th>
                <th>貢獻</th>
                <th>戰役(勝利)</th>
                <th>戰役(出征)</th>
                <th>戰役(防守)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(loc) in warData" :key="loc.id">
                <td :style="`color: ${loc.country.color[1]}; backgroundColor: ${loc.country.color[0]};`">{{loc.country ? loc.country.name : 'none'}}</td>
                <td>{{loc.nickname}}</td>
                <td>{{loc.contribution}}</td>
                <td>{{loc.wardata.win}}</td>
                <td>{{loc.wardata.atk}}</td>
                <td>{{loc.wardata.def}}</td>
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
  name: 'RankPeople',
  data() {
    return {
      localSorted: [],
    }
  },
  components:{
    
  },
  computed: {
    ...mapState(['global', 'user']),
    countries(self) {
      const global = self.global;
      const results = global.countries.map(country => {
        const cc = country.color.split(',');
        let id = country.id;
        let name = country.name;
        let color = cc[0];
        let color2 = cc[1];
        let users = global.users.filter(user => user.countryId == id);
        let maps = global.maps.filter(map => map.ownCountryId == id);
        let totalSoldier = 0;
        let totalCity = 0;
        users.map(user => {
          totalSoldier += user.soldier;
          if (user.role==1) {
            user.occupation = {name: '主公'};
          } else {
            user.occupation = user.occupationId > 0 ? global.occupationMap[user.occupationId] || {} : {};
          }
          user.online = self.loginUserIds.includes(user.id)
        });
        maps.map(map => {
          if (map.cityId > 0) totalCity += 1;
        });
        users.sort((a,b) => {
          if (a.role == 1) return -100;
          if (b.role == 1) return 100;
          const occGap = b.occupationId - a.occupationId;
          return occGap == 0 ? Math.min(Math.max(b.soldier - a.soldier, -50), 50) : occGap;
        });
        return {id, users, maps, name, color, color2, totalSoldier, totalCity}
      });
      console.log('global: ', global);
      results.sort((a,b) => {
        const cityGap = b.totalCity - a.totalCity;
        return cityGap == 0 ? b.maps.length - a.maps.length : cityGap
      })
      return results.filter(e => e.users.length > 0);
    },
    userMap() {
      const map = {};
      this.global.users.map(user => {
        map[user.id] = user;
      });
      return map;
    },
    warHashUserMap() {
      const map = {};
      this.global.users.map(user => {
        map[user.id] = {
          win: 0,
          lose: 0,
          atk: 0,
          def: 0,
          judge: 0,
          toolman: 0,
          battles: [],
        };
      });
      // console.log('warHashUserMap: ', this.global.results);
      this.global.results.map(war => {
        const isAtkWin = war.winnerCountryId == war.attackCountryIds[0];
        const isDefWin = war.winnerCountryId == war.defenceCountryId;
        if (war.atkUserIds) {
          war.atkUserIds.map(atkUserId => {
            if (atkUserId > 0 && map[atkUserId]) {
              map[atkUserId].atk += 1;
              map[atkUserId].win += isAtkWin ? 1 : 0;
              map[atkUserId].lose += isDefWin ? 1 : 0;
              map[atkUserId].battles.push(war);
            }
          });
        }
        if (war.defUserIds) {
          war.defUserIds.map(defUserId => {
            if (defUserId > 0 && map[defUserId]) {
              map[defUserId].def += 1;
              map[defUserId].win += isDefWin ? 1 : 0;
              map[defUserId].lose += isAtkWin ? 1 : 0;
              map[defUserId].battles.push(war);
            }
          });
        }
        if (war.judgeId && map[war.judgeId]) {
          map[war.judgeId].judge += 1;
          map[war.judgeId].battles.push(war);
        }
        if (war.toolmanId && map[war.toolmanId]) {
          map[war.toolmanId].toolman += 1;
          map[war.toolmanId].battles.push(war);
        }
      }); 
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
    warData() {
      const userMap = this.userMap;
      const warHashUserMap = this.warHashUserMap;
      const countryMap = this.countryMap;
      
      let results = []
      if (this.localSorted.length > 0) {
        results = this.localSorted.map(uid => {
          const next = userMap[uid] ? {...userMap[uid]} : {};
          next.wardata = warHashUserMap[uid] || {};
          next.country = countryMap[next.countryId] || {color: ['#bbb', '#444'], name: 'none'};
          return next;
        }).filter(e => !!e);
      } else {
        results = Object.values(userMap).map(user => {
          user.wardata = warHashUserMap[user.id] || {};
          user.country = countryMap[user.countryId] || {color: ['#bbb', '#444'], name: 'none'};
          return user;
        });
        results.sort((a,b) => b.wardata.win - a.wardata.win);
      }
      // console.log('warData results: ', results);
      return results
    },
  },
  mounted() {
    if (!['R343', 'R307', 'R064', 'R001'].includes(this.user.code)) {
      window.alert('福委用的');
      return this.$router.push('/');
    }

    const sendto = {model: 'RecordWar', where: {}, attributes: {}};
    // console.log('sendto: ', sendto);
    // war records in results
    this.$store.dispatch('wsEmitADMINCTL', sendto);
  },
  methods: {
    
    onClickLoginCircle(userId) {
      const result = this.loginRecordMap[userId] ? this.loginRecordMap[userId].all : [];
      const shows = result.map(e => `${e.ip.substr(-12)} => ${new Date(e.timestamp).toLocaleString()}`);
      console.log(shows.slice(0, 49));
    },
    
  },
}
</script>

<style lang="scss">
.rank-content {
  position: relative;
  overflow: auto;
  max-height: 86vh;

  .rank-table {
    width: 100%;

    th {
      font-weight: 700;
      text-shadow: 1px 0px 1px #222;
    }
    td {
      vertical-align: top;
      ul {
        list-style: none;
        padding: 0px;
        li {
          border: 1px solid #ccc;
        }
      }
      span {
        display: block;
        height: 22px;
        line-height: 20px;
      }
      .occupation {
        text-align: left;
        color: grey;

        &.new {
          color: red;
        }
      }
      .login-circle {
        width: 12px;
        height: 12px;
        display: inline-block;
        background-color: #898989;
        border-radius: 50%;
        cursor: help;
      }
    }
  }

  
}
</style>