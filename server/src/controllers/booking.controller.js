const express = require('express');
const model = require('../model.js');

const router = express.Router();

router.get('/timeList', (req, res) => {
  // console.log(req.cookies);
  const bookings = model.getTimeSlots();
  res.status(200).json({ list: bookings });
});

router.get('/assistantTimeList', (req, res) => {
  console.log(req.cookies);
  if (!req.cookies.cookieData) {
    res.status(401).send('Unauthorized');
  } else {
    // App can crash here if malicious user creates empty cookie called cookieData in their browser.
    // Not true, it won't crash (but produces error).
    const { adminName } = req.cookies.cookieData;
    const { sessionID } = req.cookies.cookieData;
    const activeSessionID = model.getAssistantSession(adminName);
    if (sessionID !== activeSessionID) {
      res.status(401).send('Unauthorized!');
    } else {
      const timeslots = model.getAssistantTimeSlots(adminName);
      res.status(200).json({ list: timeslots });
    }
  }
});

router.post('/removeTime', (req, res) => {
  const { timeslotID } = req.body;
  // return boolean as in /reserveTime to know if we should send 200 OK or 401 fail.
  model.removeTimeSlot(timeslotID);
  res.sendStatus(200);
});

router.post('/addTime', (req, res) => {
  const { adminName } = req.body;
  const { time } = req.body;
  const addSucceeded = model.addTimeSlot(adminName, time);
  if (addSucceeded) {
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});

router.post('/reserveTime', (req, res) => {
  const { timeslotID } = req.body;
  const reservationSucceeded = model.reserveTimeslot(timeslotID);
  if (reservationSucceeded) {
    res.sendStatus(200);
  } else {
    res.status(403).send('Timeslot already reserved!');
  }
});

router.post('/freeReservedTime', (req, res) => {
  const { timeslotID } = req.body;
  const freeSucceeded = model.freeTimeslot(timeslotID);
  if (freeSucceeded) {
    res.sendStatus(200);
  } else {
    res.status(403).send('Timeslot not reserved!');
  }
});

router.post('/bookTime', (req, res) => {
  const { timeslotID } = req.body;
  const { studentName } = req.body;
  console.log(timeslotID);
  const bookSucceeded = model.bookTimeslot(timeslotID, studentName);
  if (bookSucceeded) {
    console.log('success');
    res.sendStatus(200);
  } else {
    res.status(401).send('Failed to book time slot! Already booked!');
  }
});

module.exports = { router };
