/**
 * @class TimeSlot
 */

class TimeSlot {
  constructor(assistantID, assistantName, time, studentName = null) {
    this.assistantID = assistantID;
    this.name = assistantName;
    this.id = Math.random();
    this.time = time;
    this.bookedBy = studentName;
    this.reserved = false;
  }

  reserve() {
    if (this.bookedBy === null) {
      this.reserved = true;
    }
  }

  freeReservation() {
    this.reserved = false;
  }

  isReserved() {
    return this.reserved;
  }

  book(studentName) {
    this.freeReservation(); // Cannot be reserved & booked at the same time!
    this.bookedBy = studentName;
  }

  isBooked() {
    if (this.bookedBy !== null) {
      return true;
    } return false;
  }
}

module.exports = TimeSlot;
