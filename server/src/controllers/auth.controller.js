const express = require('express');
const model = require('../model.js');
const db = require('../database');
const { SessionManager } = require('../sessionManager');

const router = express.Router();

/**
 * requireAuth is an endpoint guard for logged in users.
 * aka: A middle ware used to limit access to an endpoint to authenticated users
 * @param {Request} req
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @param {Response} res
 * @param {Function} next
 * @returns {void}
 */
const requireAuth = (req, res, next) => {
  const maybeUser = model.findUser(req.session.userID);

  // "auth" check
  if (maybeUser === undefined) {
    res
      .status(401)
      .send(
        'Unauthorized. Please make sure you are logged in before attempting this action again.',
      );
    return;
  }

  next();
};

/**
 * Tells the client if they are in an authenticated user-session.
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @returns {void}
 */
router.get('/isAuthenticated', (req, res) => {
  const maybeUser = model.findUser(req.session.userID);
  res.status(200).json({
    isAuthenticated: maybeUser !== undefined,
    username: maybeUser !== undefined ? maybeUser.name : 'N/A',
  });
});

/**
 * Attempts to authenticate the user-session
 * @param {String} req.body.username - The username of the user attempting to authenticate
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @returns {void}
 */
router.post('/authenticate', (req, res) => {
  // TODO: Check if the user actually exists instead of creating a new one
  model.addUser(req.body.username, req.session.socketID);

  // Update the userID of the currently active session
  req.session.userID = req.body.username;
  req.session.save((err) => {
    if (err) console.error(err);
    else console.debug(`Saved userID: ${req.session.userID}`);
  });

  // TODO: Only send 200 when the login was successful
  res.sendStatus(200);
});

// TODO: Add 'create account' route.
// The 'authenticate' route is only supposed to check if the user can login.

function authenticateUser(username, password, cb) {
  // Pretty sure serialize not necessary.
  db.serialize(() => {
    const statement = db.prepare(
      'SELECT username, password FROM users WHERE username = ?',
    );
    statement.all([username], (err, data) => {
      if (err) {
        cb(err, false);
        throw new Error(err);
      }
      if (data.length === 0 || password !== data[0].password) {
        cb('Incorrect user auth', false);
      } else if (password === data[0].password) {
        cb(null, true);
      }
    });
    statement.finalize();
  });
}

router.post('/adminAuth', (req, res) => {
  // Problems with async JS. So, we had to place the DB call in
  // a separate function and include a cb-function as parameter.
  // Validate input data (can only be letters)
  authenticateUser(
    req.body.adminName,
    req.body.adminPass,
    (err, authenticated) => {
      if (authenticated) {
        const session = SessionManager.new();
        model.setAssistantSession(req.body.adminName, session.id);
        const cookieData = {
          sessionID: session.id,
          adminName: req.body.adminName,
        };
        res.cookie('cookieData', cookieData).sendStatus(200);
        console.info('User auth successful');
      } else {
        res.status(401).send('Login failed. Please try again.');
      }
    },
  );
});

router.get('/logout', (req, res) => {
  res.clearCookie('cookieData');
  model.removeAssistantSession(req.body.adminName);
  res.sendStatus(200);
});

module.exports = { router, requireAuth };
