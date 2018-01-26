const express = require('express'),
  profile = express.Router(),
  bcrypt = require('bcryptjs'),
  User = require('../models/user');

profile.get('/', (req, res) => {
  res.redirect('/profile/' + req.user.name);
});

profile.get('/:username', (req, res) => {
  res.append('Cache-Control', 'public, no-cache');

  res.render('profile', {
    authorized: !!req.user,
    username: req.user.name,
    email: req.user.email,
    profile: true
  });
});

profile.post('/:username/update-credentials', validateCreds, respondCreds);

profile.post('/:username/update-password', updatePassword);

function validateCreds(req, res, next) {
  const body = req.body,
    vChecks = User.validationChecks;
  let username = body.username,
    email = body.email,
    errors = {};

  check('username', username, vChecks.name);
  check('email', email, vChecks.email);

  let findName, findEmail;

  findName = User.findOne({ name: username }).exec();
  findEmail = User.findOne({ email: email }).exec();

  Promise.all([findName, findEmail]).then(
    ([name, email]) => {
      if (name !== null
          && name.toObject().name !== req.user.name
          && !errors['username'])
        errors['username'] = 'The username has already been used';

      if (email !== null
          && email.toObject().email !== req.user.email
          && !errors['email'])
        errors['email'] = 'The e-mail has already been used';

      if (errors['username'] || errors['email'])
        req.validationErrors = errors;

      next();
    },
    (err) => {
      throw new Error('validation finding error');
    }
  );

  function check(field, value, checks) {
    let i = checks.length;

    while (i--) {
      let alertMsg = checks[i](value);
      if (alertMsg) {
        errors[field] = alertMsg;
        req.validationErrors = errors;
        return;
      }
    }
  }
}

function respondCreds(req, res) {
  if (req.validationErrors)
    res.status(406).json(req.validationErrors);
  else {
    User.update({ name: req.user.name },
      { $set: { name: req.body.username, email: req.body.email } },
      (err, raw) => {
        if (err) throw new Error('db updating error');

        console.log(`credentials for ${req.user.name} were updated to ${req.body.username} and ${req.body.email}`);

        res.status(200).end();
    });
  }
}

function updatePassword(req, res, next) {
  const body = req.body,
    pwdChecks = User.validationChecks.password;
  let oldpwd = body.oldpass,
    newpwd = body.newpass,
    confpwd = body.confpass,
    errors = {};

  let findUser = User.findOne( { name: req.user.name } ).exec();

  findUser.then((user) => {
    bcrypt.compare(oldpwd, user.toObject().password, (err, isMatch) => {
      if (err) throw new Error('bcrypt error on update-password route');

      if (!isMatch) {
        errors['oldpass'] = 'Entered password is not correct';
        return res.status(406).json(errors);
      }

      check('newpass', newpwd, pwdChecks);

      if (errors['newpass'])
        return res.status(406).json(errors);

      if (newpwd !== confpwd) {
        errors['confpass'] = 'Entered password does not match';
        return res.status(406).json(errors);
      }

      let updPassword = User.updatePassword(req.user.name, newpwd, next);

      updPassword.then(() => {
        console.log(`password for ${req.user.name} changed to ${newpwd}`);
        res.status(200).end();
      });
    });
  },
  (err) => {
    throw new Error('find error on update-password route');
  });

  function check(field, value, checks) {
    let i = checks.length;

    while (i--) {
      let alertMsg = checks[i](value);
      if (alertMsg) {
        errors[field] = alertMsg;
        return;
      }
    }
  }
}

module.exports = profile;