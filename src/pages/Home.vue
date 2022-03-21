<template>
  <div class="home">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>DATAFLOW</span>
          </div>
          <div class="md-subhead">
            <button @click="onClickRefreshGlobal" v-if="['R307', 'R343', 'R064'].includes(user.code)">Refresh Global</button>
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        <!-- <Helper title="呈現Global資料" /> -->
        <div class='global-content'>
          <div v-for="(val, k) in showGlobal" :key="k" @click="onClickGlobalData(val)" class="home-datas">
            <p><span class="content-key">{{k}} </span><span>({{val.length}})</span></p>
            <p v-if="val.length > 0">{{Array.isArray(val[0]) ? 'Array[]' : Object.keys(val[0])}}</p>
            <p v-else>Hash{}</p>
            <p>_____________________________________________</p>
          </div>
        </div>
        <div class="global-data">
          <li v-for="(data, idx) in showdata" :key="data.id"><span>[{{idx}}] {{data}}</span></li>
        </div>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Helper from '@/components/panels/Helper';

export default {
  name: 'Home',
  data() {
    return {
      showdata: [],
    }
  },
  components:{
    Helper,
  },
  computed: {
    ...mapState(['global', 'user']),
    showGlobal: function(self) {
      return {
        maps: self.global.maps,
        cities: self.global.cities,
        countries: self.global.countries,
        notifications: self.global.notifications,
        battlefieldMap: self.global.battlefieldMap,
        occupationMap: self.global.occupationMap,
      }
    }
  },
  mounted() {
    clog('Home: ', this);
  },
  methods: {
    onClickGlobalData(data) {
      console.log(data);
      this.showdata = data;
    },
    onClickRefreshGlobal() {
      if (this.user.code == 'R343') {
        this.$router.push('/admin-query');
      } else {
        this.$store.dispatch('wsEmitAuthorize', 'refreshByAdmin')
      }
    },
  },
}
</script>

<style lang="scss">
.home-datas {
  cursor: pointer;
}
.home-datas:hover {
  background-color: #eee;
}
.global-content {
  height: 48vh;
  overflow: auto;
}
.content-key {
  color: red;
  font-size: 1.2em;
}
.global-data {
  height: 36vh;
  overflow: auto;
  border: 1px solid #000;
  text-align: left;
}
.global-data >li {
  border-bottom: 1px solid #eee;
}
</style>