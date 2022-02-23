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
import { mapState } from 'vuex';
import { ACT_GET_GLOBAL_DATA } from '@/enum';

export default {
  name: 'App',
  computed: {
    ...mapState(['user', 'global']),
    menu() {
      return [
        { name: '大廳', name_en: 'HALL', url: '/' },
        { name: '臥室', name_en: 'ROOM', url: '/room' },
        { name: '離開', name_en: 'SIGN OUT', url: '/logout', onclick: this.onClickLogout },
      ]
    },
  },
  mounted() {
    clog('Main App mounted $this: ', this);
    this.checkConnection();
  },
  updated() {
    
  },
  methods: {
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
        
        if (_logintimestamp) {
          payload = _logintimestamp;
        } else if (token && false) {
          payload = {token};
        } else {
          // 不同域 提交 code and pwd 嘗試登入
          // let code = window.prompt('輸入工號: ');
          // let pwd = window.prompt('密碼: ');
          /*
              Just for test and demo
          */
          let code = 'R001';
          let pwd = 123;
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
