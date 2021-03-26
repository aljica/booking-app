const Assistant = require('./models/assistant.model');
const Room = require('./models/room.model');
const TimeSlot = require('./models/timeslot.model');
const User = require('./models/user.model');

/**
 * rooms & users are effectively hash maps with the name of the entry serving as a unique key.
 */
let rooms = {};
let users = {};
const assistants = {};
let timeslots = [];

/**
 * unregisteredSockets is used as a temporary pool of sockets
 * that belonging to users who are yet to login.
 */
let nextUnregisteredSocketID = 0;
let unregisteredSockets = {};

// Will be initialized in the exports.init function
exports.io = undefined;

/**
 * Initialize the model
 * @param { { io: SocketIO.Server} } config - The configurations needed to initialize the model.
 * @returns {void}
 */
exports.init = ({ io }) => {
  exports.io = io;
};

/**
 * Add a socket.io socket to the pool of unregistered sockets
 * @param {SocketIO.Socket} socket - The socket.io socket to add to the pool.
 * @returns {Number} The ID of the socket in the pool of unregistered sockets.
 */
exports.addUnregisteredSocket = (socket) => {
  const socketID = nextUnregisteredSocketID;
  nextUnregisteredSocketID += 1;

  unregisteredSockets[socketID] = socket;
  return socketID;
};
const assignUnregisteredSocket = (socketID) => {
  const socket = unregisteredSockets[socketID];
  unregisteredSockets = Object.keys(unregisteredSockets)
    .filter((sockID) => sockID !== socketID)
    .reduce(
      (res, sockID) => ({ ...res, [sockID]: unregisteredSockets[sockID] }),
      {},
    );

  return socket;
};

/**
 * Add a message to a room & push out the message to all connected clients
 * @param {String} roomName - The name of the room to add the message to.
 * @param {String} message - The message to add.
 * @returns {void}
 */
exports.addMessage = (roomName, message) => {
  exports.findRoom(roomName).addMessage(message);
  exports.io.in(roomName).emit('msg', message);
  console.log(roomName, message);
};

/**
 * Creates a user with the given name.
 * @param {String} name - The name of the user.
 * @param {Number} socketID - An optional ID of a socket.io socket in the unregistered sockets pool.
 * @see model.addUnregisteredSocket
 * @returns {void}
 */
exports.addUser = (name, socketID = undefined) => {
  users[name] = new User(name);
  if (socketID !== undefined) {
    users[name].socket = assignUnregisteredSocket(socketID);
  }
};

/**
 * Updated the socket associated with the user with the given name.
 * @param {String} name - The name of the user.
 * @param {SocketIO.Socket} socket - A socket.io socket.
 * @returns {void}
 */
exports.updateUserSocket = (name, socket) => {
  users[name].socket = socket;
};

/**
 * Returns the user object with the given name.
 * @param {String} name - The name of the user.
 * @returns {User}
 */
exports.findUser = (name) => users[name];

/**
 * Removes the room object with the matching name.
 * @param {String} name - The name of the room.
 * @returns {void}
 */
exports.removeRoom = (name) => {
  users = Object.values(users)
    .filter((user) => user.name !== name)
    .reduce((res, user) => ({ ...res, [user.name]: user }), {});
};

/**
 * Creates a room with the given name.
 * @param {String} name - The name of the room.
 * @returns {void}
 */
exports.addRoom = (name) => {
  rooms[name] = new Room(name);
};

/**
 * Returns all the Rooms.
 * @returns {Room[]}
 */
exports.getRooms = () => Object.values(rooms);

/**
 * Removes the room object with the matching name.
 * @param {String} name - The name of the room.
 * @returns {void}
 */
exports.removeRoom = (name) => {
  rooms = Object.values(rooms)
    .filter((room) => room.name !== name)
    .reduce((res, room) => ({ ...res, [room.name]: room }), {});
};

/**
 * Return the room object with the matching name.
 * @param {String} name - The name of the room.
 * @returns {Room}
 */
exports.findRoom = (name) => rooms[name];

// Handle assistants & timeslots below

exports.addAssistant = (name) => {
  assistants[name] = new Assistant(name);
};

exports.getAssistantSession = (assistantName) => assistants[assistantName].sessionID;

exports.setAssistantSession = (assistantName, id) => {
  // Set assistant session ID (cookie).
  assistants[assistantName].sessionID = id;
};

exports.removeAssistantSession = (assistantName) => {
  console.log(assistants[assistantName].sessionID);
  assistants[assistantName].sessionID = null;
};

exports.addTimeSlot = (assistantName, time) => {
  const assistantID = assistants[assistantName].id;
  const timeslot = new TimeSlot(assistantID, assistantName, time);
  timeslots.push(timeslot);
  // Socket update
  exports.io.emit('updateTimeslots', timeslots);
  return true;
};

exports.removeTimeSlot = (timeslotID) => {
  // Check if timeslotID is numeric? Although not necessary,
  // because the type of data is contained/limited/specific to the app.
  // Handle user input validation!
  timeslots = timeslots.filter((timeslot) => timeslot.id !== timeslotID);
  // Socket update
  exports.io.emit('updateTimeslots', timeslots);
};

exports.bookTimeslot = (timeslotID, studentName) => {
  const timeslotToBook = timeslots.filter((timeslot) => timeslot.id == timeslotID)[0];
  if (!timeslotToBook.isBooked()) {
    timeslotToBook.book(studentName);
    console.log(timeslots);
    exports.io.emit('updateTimeslots', timeslots);
    return true;
  } return false;
  // return false if studentName is erroneous. I.e., handle user input validation!
};

exports.reserveTimeslot = (timeslotID) => {
  const timeslotToReserve = timeslots.filter((timeslot) => timeslot.id === timeslotID)[0];
  if (timeslotToReserve.isReserved() || timeslotToReserve.isBooked()) {
    return false;
  }
  timeslotToReserve.reserve();
  setTimeout(this.freeTimeslot, 20000, timeslotID); // Timeout handler
  exports.io.emit('updateTimeslots', timeslots);
  return true;
};

exports.freeTimeslot = (timeslotID) => {
  const timeslotToFree = timeslots.filter((timeslot) => timeslot.id == timeslotID)[0];
  if (timeslotToFree.isReserved()) {
    timeslotToFree.freeReservation();
    exports.io.emit('updateTimeslots', timeslots);
    return true;
  }
  return false;
};

exports.getAssistantTimeSlots = (assistantName) => {
  // console.log('');
  const assistantID = this.getAssistantID(assistantName);
  console.log(assistantID);
  const assistantTimes = timeslots.filter((timeslot) => timeslot.assistantID === assistantID);
  console.log(assistantTimes);
  return assistantTimes;
};

exports.getTimeSlots = () => timeslots;

exports.getAssistants = () => Object.values(assistants);

exports.getAssistantName = (assistantID) => {
  const assistantObj = Object.values(assistants); // All assistant objects
  assistantObj.forEach((assistant) => {
    if (assistantID === assistant.id) {
      return assistant.name;
    }
    return '';
  });
};

exports.getAssistantID = (assistantName) => {
  const assistant = assistants[assistantName];
  return assistant.id;
};

// Have functions called: populateAssistants() and populateTimeslots() that get run
// when the model is created. Population should occur from database.
// addTimeSlot and ?addAssistant? should update the database.
// Also, add functions removeTimeSlot() and ?removeAssistant()? which removes from database
// and removes from the current active assistants & timeslots consts.
