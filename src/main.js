
import Vue from 'vue';

import vueCookie from "vue-cookies";
import VueMaterial from 'vue-material';

import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/default.css';

import App from './App';
import router from './router';
import store from './store';

import './style/main.scss';

Vue.use(VueMaterial);
Vue.use(vueCookie);

Vue.config.productionTip = false;
const isLocal = location.hostname.match(/localhost|127.0.0.1/i);
const wcl = window.console.log;
window.clog = (...args) => {
  return isLocal ? wcl(...args) : null;
};


/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>',
});
