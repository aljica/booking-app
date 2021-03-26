<template>
  <div class="text-box col-md-4 col-md-offset-4" style="text-align: center">
    <form v-on:submit.prevent="done()">
      <label>Username:</label>
      <input class="form-control" type="text" v-model="adminName" required autofocus />
      <br>
      <label>Password:</label>
      <input class="form-control" type="password" v-model="adminPass" required autofocus />
      <br>
      <input class="btn btn-default" type="submit" value="Ok" />
    </form>
  </div>
</template>

<script>
export default {
  name: 'Admin',
  components: {},
  data: () => ({
    adminName: '',
    adminPass: '',
  }),
  methods: {
    done() {
      fetch('/api/adminAuth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminName: this.adminName,
          adminPass: this.adminPass,
        }),
      })
        .then((resp) => {
          if (resp.ok) return resp;
          this.$store.commit('setAdminAuth', false);
          this.$router.push({
            path: 'login',
          });
          throw new Error(resp.text);
        })
        .then(() => {
          this.$store.commit('setAdminAuth', true);
          this.$router.push({
            path: 'adminTimes',
          });
        })
        .catch((error) => {
          console.error('Authentication failed unexpectedly');
          throw error;
        });
    },
  },
};
</script>
