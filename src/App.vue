<template>
  <div id="app">
    <div class="top app-frame">
      <div class="title"></div>
    </div>
    <div class="middle app-frame">
      <md-list class="menu" router-link>
        <div class="meun-wrapper">
          <md-list-item v-for="(m, m_i) in menu" :to="m.url" :key="m_i">
            <div class="md-list-item-text" v-on="m.onclick ? {click: m.onclick} : null">
              <div class="main">{{ m.name_en }}</div>
              <div class="sub">{{ m.name }}</div>
            </div>
          </md-list-item>
        </div>
      </md-list>
      <div class="main-router-view">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import { ACT_GET_GLOBAL_DATA } from '@/enum';
import { isWelfare } from '../server/websocketctl/algorithm';



export default {
  name: 'App',
  computed: {
    ...mapState(['user', 'global']),
    menu() {
      // const isWelfare = ['R001', 'R064', 'R343'].includes(this.user.code);
      const list = [
        { name: '資料', name_en: 'DATAFLOW', url: '/data' },
        { name: '測試', name_en: 'TEST', url: '/room' },
        { name: '獎勵', name_en: 'REWARD', url: '/reward' },
        { name: '排名', name_en: 'RANK', url: '/rank' },
        { name: '排名(武將)(戰役)', name_en: 'RANKBATTLE', url: '/rankpeople' },
        { name: '排名(武將)(建築)', name_en: 'RANKAPI', url: '/rankpeopleapi' },
        { name: '離開', name_en: 'SIGN OUT', url: '/logout', onclick: this.onClickLogout },
      ];
      if (!isWelfare(this.user)) {
        list.splice(2, 4);
      }
      return list
    },
  },
  mounted() {
    clog('Main App mounted $this: ', this);
    this.checkConnection();
    this.checkKeepAliveTimer();
  },
  updated() {
    
  },
  methods: {
    ...mapMutations(['addDatetimeSeconds']),
    checkKeepAliveTimer() {
      if (typeof window.secondInterval == 'undefined') {
        window.secondInterval = window.setInterval(() => {
          if (this.global.keepAliveNum > 30) {
            window.clearInterval(window.secondInterval);
            window.alert('已離線超時');
            window.location.href = '/logout';
          } else {
            this.addDatetimeSeconds(1);
          }
        }, 1000);
      }
    },
    onClickLogout(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      window.location.href = '/logout';
    },
    checkConnection() {
      if (this.user.connected) {
        // 同域用 login time stamp 確認登入狀態即可
        const _logintimestamp = this.$cookies.get('_logintimestamp_');
        // 已經登入過 有token
        const token = window.localStorage.getItem('_token_');
        var payload;

        if (location.hostname == 'localhost') {
          payload = {
            code : 'R343',
            pwd : '343'
          }
        } else if (_logintimestamp) {
          payload = _logintimestamp;
        } else if (token) {
          payload = {token};
        } else {
          let code = window.prompt('輸入工號: ');
          let pwd = window.prompt('密碼: ');
          
          /*
              Just for test and demo
          */
          // let code = 'R001';
          // let pwd = 123;
          payload = {code, pwd};
        }

        this.$store.dispatch('wsEmitAuthorize', payload);
        
      } else {
        if (window.apptimer) { window.clearTimeout(window.apptimer); }
        window.apptimer = window.setTimeout(this.checkConnection, 1000);
      }
    }
  },
}
</script>