const mongoose = require('mongoose'),
  bcrypt = require('bcryptjs'),
  winston = require('winston'),
  logger = winston.loggers.get('main-logger');

let userSchema = new mongoose.Schema({
  name: 'string',
  email: 'string',
  password: 'string',
  expireAt: 'date'
}, {
  minimize: false,       // allows to keep empty objects as a field values (otherwise the field won't be used)
  strict: false       // allows to store fields that are not described in the schema
});

userSchema.index({ expireAt: 1 }, {       // autoIndexes and background are true by default
  name: 'regIdx',
  sparse: true,
  expireAfterSeconds: 24 * 3600
});

let User = mongoose.model('User', userSchema);

User.updatePassword = updatePassword;

User.validationChecks = {};

User.validationChecks.name = [
  (username) => {
    if (username.length > 24)
      return 'Username must be equal or less than 24 characters';
  },
  (username) => {
    if (username.length < 3)
      return 'Username must be at least 3 characters';
  },
  (username) => {
    if (username.search(/^[a-z0-9_]+$/i) === -1
      && username !== '')
      return 'Username must consist only of A-Z, a-z, 0-9 and _';
  }
];

User.validationChecks.email = [
  (email) => {
    if (email.search(
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      ) === -1)
      return 'Enter a valid e-mail address';
  }
];

User.validationChecks.password = [
  (password) => {
    if (password.search(/[A-Z]+/) === -1
      || password.search(/[a-z]+/) === -1
      || password.search(/[0-9]+/) === -1)
      return 'For each of A-Z, a-z, 0-9 at least one character must be presented';
  },
  (password) => {
    if (password.length > 24)
      return 'Password must be equal or less than 24 characters';
  },
  (password) => {
    if (password.length < 6)
      return 'Password must be at least 6 characters';
  },
  (password) => {
    if (password.search(/^[A-Za-z0-9_-]+$/) === -1
      && password !== '')
      return 'Password must consist only of A-Z, a-z, 0-9, _ and -';
  }
];

User.on('index', (err) => {
  if (err) return logger.error(new Error('User model index creation has failed'));

  logger.log('User model index has been built');
});

function updatePassword(username, newpwd, next) {
  return bcrypt.genSalt(10).then((salt) => {
      return bcrypt.hash(newpwd, salt);
    })
    .then((hash) => {
      return User.findOneAndUpdate( { name: username }, { $set: { password: hash } }).exec();
    })
    .catch((err) => {
      next(err);
    });
}

module.exports = User;