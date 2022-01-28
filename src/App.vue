<template>
  <div id="app">
    <div class="logo">
      <!-- <img src="/static/imgs/logo_small.png" alt="" /> -->
    </div>
    <div class="title">
      <div class="top">TITLE</div>
    </div>
    <md-list class="menu" router-link>
      <div class="meun-wrapper">
        <md-list-item v-for="(m, m_i) in menu" :to="m.url" :key="m_i">
          <div class="md-list-item-text">
            <div class="main">{{ m.name_en }}</div>
            <div class="sub">{{ m.name }}</div>
          </div>
        </md-list-item>
        <md-list-item><div class="md-list-item-text" @click="onClickLogout" :style="{cursor: 'pointer'}"><div class="main">SIGN OUT</div><div class="sub">離開</div></div></md-list-item>
      </div>
    </md-list>
    <router-view />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { ACT_GET_PEOPLE_DATA } from './store/enum';
export default {
  name: 'App',
  data() {
    return {
      menu: [
        { name: '大廳', name_en: 'HALL', url: '/' },
        { name: '臥室', name_en: 'ROOM', url: '/room' },
        // { name: '離開', name_en: 'SIGN OUT', url: '/logout' },
      ]
    }
  },
  computed: {
    ...mapState(['user']),
  },
  mounted() {
    
  },
  updated() {
    
  },
  methods: {
    onClickLogout() {
      window.location.href = '/logout';
    },
  },
}
</script>
