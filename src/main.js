
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


/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>',
});
