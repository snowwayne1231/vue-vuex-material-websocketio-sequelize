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
import { ACT_GET_USERS_INFO } from '@/enum';

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
    clog('Main App $this: ', this);
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
        this.$store.dispatch('wsEmitAuthorize', this.$cookies.get('_logintimestamp_'));
        this.$store.dispatch('wsEmitMessage', {act: ACT_GET_USERS_INFO});
      } else {
        if (window.apptimer) { window.clearTimeout(window.apptimer); }
        window.apptimer = window.setTimeout(this.checkConnection, 3000);
      }
    }
  },
}
</script>
