import Vue from 'vue';
import Router from 'vue-router';
import Home from '@/pages/Home';
import Room from '@/pages/Room';
import AdminQuery from '@/pages/AdminQuery';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/room',
      name: 'Room',
      component: Room,
    },
    {
      path: '/admin-query',
      name: 'AdminQuery',
      component: AdminQuery,
    },
  ],
});
