<template>
  <div class="home">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>RANK PEOPLE BATTLES</span>
            <!-- <button @click="saveLocalOcc">Save Occ</button>
            <button @click="onClickRecovry">*Recovry*</button> -->
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        <div class='rank-content'>
          <table class="rank-table-war">
            <thead>
              <tr>
                <th>國家</th>
                <th>暱稱</th>
                <th class="sortable" :class="{activate: 'contribution' == sortKey }" @click="onClickSort('contribution')">貢獻</th>
                <th class="sortable" :class="{activate: '.win' == sortKey }" @click="onClickSort('.win')">戰役(勝利)</th>
                <th class="sortable" :class="{activate: '.total' == sortKey }" @click="onClickSort('.total')">戰役總數 (出征/防守)</th>
                <th >戰役勝率</th>
                <th class="sortable" :class="{activate: '.judge' == sortKey }" @click="onClickSort('.judge')">裁判數</th>
                <th class="sortable" :class="{activate: '.toolman' == sortKey }" @click="onClickSort('.toolman')">攝影數</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="loc in warDatas" :key="loc.id">
                <td :style="`color: ${loc.country.color[1]}; backgroundColor: ${loc.country.color[0]};`">{{loc.country ? loc.country.name : 'none'}}</td>
                <td>{{loc.nickname}}</td>
                <td>{{loc.contribution}}</td>
                <td>{{loc.wardata.win}}</td>
                <td :title="showTitleByBattles(loc.wardata.battles)">{{loc.wardata.total}} ⚔️ ({{loc.wardata.atk}} / {{loc.wardata.def}})</td>
                <td>{{Math.round(loc.wardata.win / loc.wardata.total * 100)}} %</td>
                <td>{{loc.wardata.judge}}</td>                
                <td>{{loc.wardata.toolman}}</td>  
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
      sortKey: '',
      sortRuleAsc: true,
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
    hashMapId() {
      const map = {};
      this.global.maps.map(m => {
        map[m.id] = m;
      })
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
          total: 0,
          judge: 0,
          toolman: 0,
          battles: [],
          helpers: [],
        };
      });
      console.log('warHashUserMap: ', this.global.results);
      const realBattles = this.global.results.filter(r => new Date(r.timestamp) < new Date(r.updatedAt));
      console.log('realBattles: ', realBattles);
      realBattles.map(war => {
        if (typeof war.attackCountryIds == 'undefined') { return false }
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
          map[war.judgeId].helpers.push(war);
        }
        if (war.toolmanId && map[war.toolmanId]) {
          map[war.toolmanId].toolman += 1;
          map[war.toolmanId].helpers.push(war);
        }
      });
      Object.keys(map).map(key => {
        map[key].total = map[key].atk + map[key].def;
      })
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
    warDatas() {
      const userMap = this.userMap;
      const warHashUserMap = this.warHashUserMap;
      const countryMap = this.countryMap;
      
      let results = []
      if (this.localSorted.length > 0) {
        results = this.localSorted.map(uid => {
          const next = userMap[uid] ? {...userMap[uid]} : {};
          next.wardata = warHashUserMap[uid] || {};
          next.country = countryMap[next.countryId] || {color: ['#bbb', '#444'], name: '浪'};
          return next;
        }).filter(e => !!e);
      } else {
        results = Object.values(userMap).map(user => {
          user.wardata = warHashUserMap[user.id] || {};
          user.country = countryMap[user.countryId] || {color: ['#bbb', '#444'], name: '浪'};
          return user;
        });
        results.sort((a,b) => {
          const gapnum = b.wardata.total - a.wardata.total;
          return gapnum == 0 ? b.wardata.win - a.wardata.win : gapnum;
        });
      }
      // console.log('warData results: ', results);
      return results;
    },
  },
  mounted() {
    if (!['R343', 'R307', 'R064', 'R001'].includes(this.user.code)) {
      window.alert('福委用的');
      return this.$router.push('/');
    }

    // war records in results
    this.$store.dispatch('wsEmitADMINCTL', {model: 'RecordWar', where: {}, attributes: {}});
    // this.$store.dispatch('wsEmitADMINCTL', {model: 'RecordApi', where: {'model': 'City'}, attributes: {}});
  },
  methods: {
    onClickSort(key) {
      const deeper = key[0] == '.';
      if (this.sortKey == key) {
        this.sortRuleAsc = !this.sortRuleAsc
      } else {
        this.sortKey = key;
      }

      let _ary = [];
      if (deeper) {
        const warKey = key.replace('.', '');
        _ary = this.warDatas.map(e => [e.id, e.wardata[warKey]]);
      } else {
        _ary = this.warDatas.map(e => [e.id, e[key]]);
      }

      const isasc = this.sortRuleAsc;
      _ary.sort((a,b) => {
        return isasc ? a[1] - b[1] : b[1] - a[1];
      });
      this.localSorted = _ary.map(e => e[0]);
    },
    showTitleByBattles(battles) {
      const _hash = this.hashMapId;
      return battles.map(e => {
        const mapName = _hash[e.mapId] ? _hash[e.mapId].name : 'unKnown';
        const time = new Date(e.timestamp).toLocaleDateString();
        return `[${mapName}之戰] ${time}`;
      }).join(',\r\n');
    }
    
  },
}
</script>

<style lang="scss">
.rank-content {
  position: relative;
  overflow: auto;
  max-height: 86vh;

  .rank-table-war {
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
    }

    .sortable {
      cursor: pointer;
      background-color: #ddffff;
      
      &:hover {
        
        background-color: #00ffff;
      }
      &.activate {
        background-color: #00ffff;
      }
    }
  }

  
}
</style>