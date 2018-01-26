const express = require('express'),
  login = express.Router(),
  bcrypt = require('bcryptjs'),
  passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  User = require('../../models/user');

passport.serializeUser((user, done) => {
  console.log('serialized');
  return done(null, user._id);
});

passport.deserializeUser((id, done) => {
  console.log('deserialized');
  User.findById(id, { password: 0, __v: 0 }, (err, user) => {
    if (err) return done(err, false);

    if (user === null)
      return done(null, false);

    return done(null, user.toObject());
  });
});

passport.use(new LocalStrategy({
    session: true       // true is default
  },
  (username, candidatePwd, done) => {       // seems that it handle empty input by itself
    User.findOne({ name: username }, (err, user) => {
      if (err) return done(err);

      if (user === null
          || user.toObject().hash)
        return done(null, false);

      bcrypt.compare(candidatePwd, user.toObject().password, (err, isMatch) => {
        if (err) return done(err);

        if (!isMatch)
          return done(null, false);

        console.log('login passed');
        return done(null, user.toObject());
      })
    })
  }
));

login.post('/', (req, res, next) => {

  if (req.user)       // to prevent user login with an agent that already has a login session
    res.status(409).end();

  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);

    if (!user) return res.status(401).end();

    req.logIn(user, (err) => {
      if (err) return next(err);

      if (!req.body.keeplogin)
        req.session.cookie.expires = null;

      return res.status(200).end();
    });
  })(req, res, next);
});

module.exports = login;