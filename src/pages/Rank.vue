<template>
  <div class="home">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>RANK DATA</span>
            <button @click="saveLocalOcc">Save Occ</button>
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
                  {{country.totalSoldier}}
                </td>
              </tr>
              <tr>
                <th>武將</th>
                <td v-for="(country) in countries" :key="country.id">
                  <ul>武將數: {{country.users.length}}</ul>
                  <ul>
                    <li v-for="(user) in country.users" :key="user.id">
                      <span>{{user.nickname}} ⚔️({{user.soldier}})</span>
                      <span class="occupation" :class="{new: user.occupationId > 0 && !localOccMap[user.id]}">{{user.occupation.name || ''}} ({{user.contribution}})</span>
                    </li>
                  </ul>
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

export default {
  name: 'Rank',
  data() {
    return {
      localOccMap: {},
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
    }
  },
  mounted() {
    this.loadLocalOcc();
  },
  methods: {
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
      }
      .occupation {
        text-align: left;
        color: grey;

        &.new {
          color: red;
        }
      }
    }
  }
}
</style>