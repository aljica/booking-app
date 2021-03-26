import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

// no-param-reassign prevents store.isAuthenticated = isAuthenticated
/* eslint-disable no-param-reassign */
export default new Vuex.Store({
  state: {
    isAuthenticated: false,
    isAdminAuth: false,
  },
  mutations: {
    setIsAuthenticated(store, isAuthenticated) {
      store.isAuthenticated = isAuthenticated;
    },
    setAdminAuth(store, isAdminAuth) {
      store.isAdminAuth = isAdminAuth;
    },
  },
  getters: {
    adminAuth: state => state.isAdminAuth,
  },
  actions: {
  },
  modules: {
  },
});
