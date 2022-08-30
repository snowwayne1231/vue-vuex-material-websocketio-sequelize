import Vue from 'vue';
import Router from 'vue-router';
import Home from '@/pages/Home';
import Room from '@/pages/Room';
import Reward from '@/pages/Reward';
import AdminQuery from '@/pages/AdminQuery';
import Rank from '@/pages/Rank';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/data',
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
    {
      path: '/reward',
      name: 'Reward',
      component: Reward,
    },
    {
      path: '/rank',
      name: 'Rank',
      component: Rank,
    }
  ],
});
