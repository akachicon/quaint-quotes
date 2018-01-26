const express = require('express'),
  logout = express.Router();

logout.get('/', (req, res) => {       // in case session had staled while page was opened is-authed check will make an error
  req.logout();
  res.redirect('/');
});

module.exports = logout;