const express = require('express'),
  signup = express.Router(),
  bcrypt = require('bcryptjs'),
  nodemailer = require('nodemailer'),
  User = require('../../models/user');

let transporter = nodemailer.createTransport({
  service: 'Yandex',
  auth: {
    user: 'personal-vocabulary@yandex.com',
    pass: '_personal-Vocabu1ary'
  }
});

signup.post('/', validate, respond);

signup.get('/acknowledge', (req, res, next) => {
  let username = req.query.username,
    hash = req.query.hash;

  User.findOne({ name: username }, (err, user) => {
    if (err) throw new Error('acknowledge finding error');

    if (user !== null) {
      if (user.toObject().hash !== hash){
        res.flash('regFailure', 'Failure! Invalid data to confirm.');
        res.redirect('/');
        return;
      }
      User.update({ name: username }, { $unset: { expireAt: '', hash: '' } }, (err, raw) => {
        if (err) throw new Error('db updating error');

        console.log('"expireAt" and "hash" fields on ' + username + ' were deleted');

        res.flash('regSuccess', 'You have been successfully verified! Now you can log in.');
        res.redirect('/');
      });
    } else {
      console.log('there is no such user in db');

      res.flash('regFailure', 'Failure! There is no credentials to confirm.');
      res.redirect('/');
    }
  })
});

signup.get('/unique', (req, res, next) => {
  let username = req.query.username;

  User.findOne({ name: username }, (err, user) => {
    if (err) throw new Error('finding error on unique router');

    if (user === null)
      res.status(200).end();
    else
      res.status(406).end();
  });
});

function validate(req, res, next) {
  const body = req.body;
  let username = body.username,
    email = body.email,
    password = body.password,
    confpass = body.confpass,
    errors = {};

  let vChecks = User.validationChecks,
    confpassChecks;

  confpassChecks = [
    (confpass) => {
      if (password !== confpass)
        return 'Entered password does not match';
    },
    () => {
      if (errors.hasOwnProperty('password'))
        return 'Enter a valid password to allow confirmation';
    }
  ];

  check('username', username, vChecks.name);
  check('email', email, vChecks.email);
  check('password', password, vChecks.password);
  check('confpass', confpass, confpassChecks);

  let findName, findEmail;

  findName = User.findOne({ name: username }).exec();
  findEmail = User.findOne({ email: email }).exec();

  Promise.all([findName, findEmail]).then(
    ([name, email]) => {
      if (name !== null
          && !errors['username'])
        errors['username'] = 'The username has already been used';

      if (email !== null
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

function respond(req, res, next) {
  if (req.validationErrors)
    res.status(406).json(req.validationErrors);
  else {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) throw new Error('bcrypt gensalt error');

      bcrypt.hash(req.body.password, salt, (err, hash) => {
        if (err) throw new Error('bcrypt hash error');

        let user = new User({
          name: req.body.username,
          email: req.body.email,
          password: hash,
          expireAt: new Date()
        });

        user.save((err) => {
          if (err) throw new Error('registration failed');

          bcrypt.genSalt(10, (err, salt) => {
            if (err) throw new Error('bcrypt gensalt error');

            bcrypt.hash(Math.random().toString(36).slice(2), salt, (err, hash) => {
              if (err) throw new Error('bcrypt hash error');

              User.update({ name: req.body.username }, { $set: { hash: hash } }, (err, raw) => {
                if (err) throw new Error('db updating error');
              });

              // TODO: make an actual recipient and path
              transporter.sendMail({
                from: 'personal-vocabulary@yandex.com',
                to: 'dany011094@gmail.com',
                subject: 'Your personal-vocabulary account registration',
                text: 'Use the suggested link to activate your account',
                html: '<p>Use the suggested link to activate your account:</p>'
                  + '<a href="http://localhost:3000/signup/acknowledge?username='
                  + req.body.username + '&hash=' + hash + '">http://localhost:3000/signup/acknowledge?username='
                  + req.body.username + '&hash=' + hash + '</a>'
              },
              (err, info) => {
                if (err) throw new Error('email message was not delivered');
                console.log('message sent', info);
              });
            });
          });
          res.status(201).end();
        });
      });
    });
  }
}

module.exports = signup;