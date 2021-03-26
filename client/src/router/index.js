import Vue from 'vue';
import VueRouter from 'vue-router';
import ListView from '../views/List.vue';
import RoomView from '../views/Room.vue';
import LoginView from '../views/Login.vue';
import BookingView from '../views/Booking.vue';
import AdminView from '../views/Admin.vue';
import AdminTimesView from '../views/AdminTimes.vue';
import ReserveView from '../views/Reserve.vue';
import store from '../store';

Vue.use(VueRouter);

const routes = [
  { path: '/', redirect: '/list' },
  { path: '/list', component: ListView },
  { path: '/room/:roomName', component: RoomView },
  { path: '/login', component: LoginView },
  { path: '/bookings', component: BookingView },
  { path: '/admin', component: AdminView },
  { path: '/adminTimes', component: AdminTimesView },
  { path: '/reserve/:timeslotID', component: ReserveView },
];

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes,
});

// Setup Authentication guard
router.beforeEach((to, from, next) => {
  if (store.state.isAuthenticated || to.path === '/login') {
    next();
  } else {
    console.info('Unauthenticated user. Redirecting to login page.');
    next('/login');
  }
});

export default router;
