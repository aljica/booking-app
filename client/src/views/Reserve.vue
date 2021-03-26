<template>
  <div class="text-box col-md-4 col-md-offset-4" style="text-align: center">
    <h1>What is your name?</h1>
    <form v-on:submit.prevent="done()">
      <input class="form-control" type="text" v-model="studentName" required autofocus />
      <input class="btn btn-default" type="submit" value="Ok" />
    </form>
    <input v-on:click="cancelReservation()" class="btn btn-default" value="Cancel" />
  </div>
</template>

<script>
export default {
  name: 'Reserve',
  components: {},
  data: () => ({
    studentName: '',
    countdown: 20,
  }),
  methods: {
    cancelReservation() {
      fetch('/api/freeReservedTime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeslotID: this.$route.params.timeslotID,
        }),
      })
        .then((resp) => {
          if (resp.ok) return resp;
          throw new Error(resp.text);
        })
        .catch((error) => {
          console.error('Failed for some reason');
          throw error;
        });
      this.$router.push({
        path: '/bookings',
      });
    },
    countdownTimer() {
      if (this.countdown > 0) {
        setTimeout(() => {
          this.countdown -= 1;
          if (this.countdown === 0) {
            this.$router.push({
              path: '/bookings',
            });
          }
          this.countdownTimer();
        }, 1000);
      }
    },
    done() {
      fetch('/api/bookTime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentName: this.studentName,
          timeslotID: this.$route.params.timeslotID,
        }),
      })
        .then((resp) => {
          if (resp.ok) return resp;
          this.$router.push({
            path: `/reserve/${this.$route.params.timeslotID}`,
          });
          throw new Error(resp.text);
        })
        .then(() => {
          this.$router.push({
            path: '/bookings',
          });
        })
        .catch((error) => {
          console.error('Authentication failed unexpectedly');
          throw error;
        });
    },
  },
  created() {
    this.countdownTimer();
  },
};
</script>
