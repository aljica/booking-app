<template>
  <div class="container">
    <section class="col-md-10 col-md-offset-1">
      <div class="row" style="text-align: center;">
        <h1>Admin Time Slots</h1>
      </div>

      <div class="row">
        <div class="well" v-for="timeslot in timeslots" :key="timeslot.assistantID">
          <div class="row" style="text-align: center;">
            <h4>
              <span v-on:dblclick="removeTimeSlot(timeslot)">{{ timeslot.time }}</span>
              <span v-if="free(timeslot)">Free</span>
              <span v-else>Taken</span>
              <br>
              <span v-if="booked(timeslot) !== null">{{ booked(timeslot) }}</span>
            </h4>
          </div>
          <div style="text-align: right;">
            <h4>
              <span>{{ timeslot.name }}</span>
            </h4>
          </div>
        </div>
      </div>
      <input v-if="authenticated()" v-on:click="logout()" class="btn btn-default" value="Logout" />
      <form v-if="authenticated()" v-on:submit.prevent="addTimeSlot()">
        <input v-model="time" class="form-control" type="text" required autofocus />
        <input class="btn btn-default" type="submit" value="Add Time" />
      </form>
    </section>
  </div>
</template>

<script>
export default {
  name: 'AdminTimes',
  components: {
  },
  data: () => ({
    timeslots: [],
    socket: null,
    assistantName: '',
    time: '',
  }),
  methods: {
    booked(timeslot) {
      if (timeslot.bookedBy === null) {
        return null;
      } return timeslot.bookedBy;
    },
    free(timeslot) {
      if (timeslot.reserved || timeslot.bookedBy !== null) {
        return false;
      } return true;
    },
    logout() {
      this.$store.commit('setAdminAuth', false);
      this.$router.push({
        path: '/bookings',
      });
      fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type':
          'application/json',
        },
        body: JSON.stringify({
          adminName: this.assistantName,
        }),
      })
        .then((resp) => {
          if (resp.ok) return resp;
          throw new Error(resp.text);
        })
        .catch((error) => {
          throw error;
        });
    },
    authenticated() {
      return this.$store.getters.adminAuth;
    },
    getTimeSlotID(timeslot) {
      console.log(timeslot.id);
    },
    addTimeSlot() {
      fetch('/api/addTime', {
        method: 'POST',
        headers: {
          'Content-Type':
          'application/json',
        },
        body: JSON.stringify({
          adminName: this.assistantName,
          time: this.time,
        }),
      })
        .then((resp) => {
          if (resp.ok) return resp;
          throw new Error(resp.text);
        })
        .catch((error) => {
          console.error('Something went wrong when trying to remove timeslot');
          throw error;
        });
      this.time = '';
      this.updateTimeSlots();
    },
    removeTimeSlot(timeslot) {
      fetch('/api/removeTime', {
        method: 'POST',
        headers: {
          'Content-Type':
          'application/json',
        },
        body: JSON.stringify({
          timeslotID: timeslot.id,
        }),
      })
        .then((resp) => {
          if (resp.ok) return resp;
          throw new Error(resp.text);
        })
        .catch((error) => {
          console.error('Something went wrong when trying to remove timeslot');
          throw error;
        });
      this.updateTimeSlots();
    },
    updateTimeSlots() {
      fetch('/api/assistantTimeList')
        .then(res => res.json())
        .then((data) => {
          this.timeslots = data.list;
          this.assistantName = this.timeslots[0].name;
        })
        .catch(console.error);
    },
  },
  created() {
    this.socket = this.$root.socket;
    this.socket.on('updateTimeslots', () => {
      this.updateTimeSlots();
    });
    this.updateTimeSlots();
  },
};
</script>
