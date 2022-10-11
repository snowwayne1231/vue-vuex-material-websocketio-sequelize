<template>
  <div class="home">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>RANK DATA</span>
            <button @click="saveLocalOcc">Save Occ</button>
            <button @click="onClickRecovry">*Recovry*</button>
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        <!-- <Helper title="呈現Global資料" /> -->
        <div class='rank-content'>
          <table class="rank-table">
            <thead>
              <tr>
                <th></th>
                <th v-for="(country) in countries" :key="country.id" :style="{color: country.color2, backgroundColor: country.color, width: `${Math.floor(100/(countries.length+1))}%`}"><span>{{country.name}}</span></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>城池 / 領地</th>
                <td v-for="(country) in countries" :key="country.id">
                  {{country.totalCity}} / {{country.maps.length}}
                </td>
              </tr>
              <tr>
                <th>總兵力</th>
                <td v-for="(country) in countries" :key="country.id">
                  {{country.totalSoldier.toLocaleString()}}
                </td>
              </tr>
              <tr>
                <th>武將</th>
                <td v-for="(country) in countries" :key="country.id">
                  <ul>武將數: {{country.users.length}}</ul>
                  <ul>
                    <li v-for="(user) in country.users" :key="user.id">
                      <span :title="user.code"><b v-if="user.online" class="online" @click="onClickOnline(user)">🟢</b>{{user.nickname}} ⚔️({{user.soldier.toLocaleString()}})</span>
                      <span class="occupation" :class="{new: user.occupationId > 0 && !localOccMap[user.id]}">{{user.occupation.name || ''}} ({{user.contribution}})</span>
                      <span @click="onClickLoginCircle(user.id)"><i class="login-circle" v-for="(ldata, idx) in (loginRecordMap[user.id] ? loginRecordMap[user.id].uniqle : [])" :key="idx" :title="`IP [${ldata.ip}] Time [${ldata.timestamp}]`"></i></span>
                    </li>
                  </ul>
                </td>
              </tr>
              <tr>
                <th>登入異常</th>
                <td :colspan="countries.length">
                  <span v-for="(otl, idx) in overThreeLoginIp" :key="idx">
                    IP [ {{otl.ip}} ] | Users: {{otl.users}}
                  </span>
                </td>
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
import axios from 'axios';

export default {
  name: 'Rank',
  data() {
    return {
      localOccMap: {},
      loginRecordMap: {},
      overThreeLoginIp: [],
    }
  },
  components:{
    
  },
  computed: {
    ...mapState(['global', 'user']),
    loginUserIds(self) {
      const ids = [];
      self.global.sessionInfos.map(si => {
        ids.push(si.userId)
      });
      return ids
    },
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
    warData() {
      return this.globl.results
    },
  },
  mounted() {
    if (!['R343', 'R307', 'R064', 'R001'].includes(this.user.code)) {
      window.alert('福委用的');
      return this.$router.push('/');
    }
    const self = this;
    this.loadLocalOcc();
    axios.post('/getloginrecord').then(res => {
      self.handleLoginData(res.data);
    }).catch(err => {
      console.log('err: ', err);
    });
    this.$store.dispatch('wsEmitADMINCTL', {sessioninfo: true});

    const sendto = {model: 'RecordWar', where: {}, attributes: {}};
    // console.log('sendto: ', sendto);
    // war records in results
    this.$store.dispatch('wsEmitADMINCTL', sendto);
  },
  methods: {
    handleLoginData(data) {
      const self = this;
      const nextmap = {};
      const ipmap = {};
      const otli = [];
      const userMap = {};
      self.global.users.map(user => {
        userMap[user.id] = user;
      });
      data.map(d => {
        let _ = {timestamp: d.timestamp, ip: d.ip};
        if (nextmap[d.userId]) {
          if (nextmap[d.userId].uniqle.findIndex(e => e.ip == d.ip) < 0) {
            nextmap[d.userId].uniqle.push(_);
          }
          nextmap[d.userId].all.push(_);
        } else {
          nextmap[d.userId] = {all: [_], uniqle: [_]};
        }
        if (ipmap[d.ip]) {
          if (!ipmap[d.ip].includes(d.userId)) {
            ipmap[d.ip].push(d.userId);
          }
        } else {
          ipmap[d.ip] = [d.userId];
        }
      });
      Object.keys(ipmap).map(ip => {
        const loc = ipmap[ip];
        if (loc.length >= 3) {
          let users = loc.map(uid => userMap[uid] ? userMap[uid].nickname : 'unknown');
          otli.push({ip, users});
        }
      })
      self.loginRecordMap = nextmap;
      self.overThreeLoginIp = otli;
      // console.log('loginRecordMap: ', self.loginRecordMap);
      console.log('overThreeLoginIp: ', self.overThreeLoginIp);
    },
    loadLocalOcc() {
      let localOcc = window.localStorage.getItem('__localOcc__');
      if (typeof localOcc == 'string') {
        localOcc = JSON.parse(localOcc);
        this.localOccMap = localOcc[0];
      }
    },
    saveLocalOcc() {
      const nextMap = {};
      this.global.users.map(user => {
        if (user.occupationId > 0) {
          nextMap[user.id] = user.occupationId;
        }
      });
      window.localStorage.setItem('__localOcc__', JSON.stringify([nextMap]));
      this.localOccMap = nextMap;
    },
    onClickLoginCircle(userId) {
      const result = this.loginRecordMap[userId] ? this.loginRecordMap[userId].all : [];
      const shows = result.map(e => `${e.ip.substr(-12)} => ${new Date(e.timestamp).toLocaleString()}`);
      console.log(shows.slice(0, 49));
    },
    onClickOnline(user) {
      const userId = user.id;
      if (userId) {
        if (window.confirm(`確定斷開 ${user.nickname} 的連線嗎?`)) {
          this.$store.dispatch('wsEmitADMINCTL', {sessioninfo: true, userId});
        }
      }
    },
    onClickRecovry() {
      window.localStorage.setItem('__onClickRecovry__', new Date().toLocaleString());
      if (this.user.code == 'R343') {
        const location = window.location.hostname == 'localhost' ? 'localhost:81' : window.location.host;
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `http://${location}/checkweek`);
        xhr.send();
      }
    }
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

  .online {
    cursor: pointer;
  }
}
</style>