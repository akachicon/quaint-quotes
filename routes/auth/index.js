const express = require('express'),
  auth = express.Router(),
  signup = require('./signup'),
  login = require('./login'),
  logout = require('./logout'),
  pwdreset = require('./reset-password');

auth.use('/signup', signup);
auth.use('/login', login);
auth.use('/logout', logout);
auth.use('/reset-password', pwdreset);

module.exports = auth;
