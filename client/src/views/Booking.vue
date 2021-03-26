<template>
  <div class="container">
    <section class="col-md-10 col-md-offset-1">
      <div class="row" style="text-align: center;">
        <h1>Time Slots</h1>
      </div>

      <div class="row">
        <div id="x" class="well" v-for="timeslot in timeslots" :key="timeslot.assistantID">
          <div class="row" style="text-align: center;">
            <h4>
              <span v-on:click="reserve(timeslot)">{{ timeslot.time }}</span>
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
    </section>
  </div>
</template>

<script>
export default {
  name: 'Booking',
  components: {
  },
  data: () => ({
    timeslots: [],
    socket: null,
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
    authenticated() {
      return this.$store.getters.adminAuth;
    },
    getTimeSlotID(timeslot) {
      console.log(timeslot.id);
    },
    reserve(timeslot) {
      fetch('/api/reserveTime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeslotID: timeslot.id,
        }),
      })
        .then((resp) => {
          if (resp.ok) return resp;
          console.log('That time is already booked!');
          throw new Error(resp.text);
        })
        .then(() => {
          this.$router.push({
            path: `/reserve/${timeslot.id}`,
          });
        })
        .catch((error) => {
          console.error('Something went wrong when trying to reserve timeslot');
          throw error;
        });
    },
  },
  created() {
    this.socket = this.$root.socket;
    this.socket.on('updateTimeslots', (timeslots) => {
      this.timeslots = timeslots;
    });

    fetch('/api/timeList')
      .then(res => res.json())
      .then((data) => {
        this.timeslots = data.list;
      })
      .catch(console.error);
  },
};
</script>
