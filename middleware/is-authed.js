const AccessError = require('../errors/http-error'),
  winston = require('winston'),
  authlogger = winston.loggers.get('auth-logger');

function isAuthed(req, res, next) {
  if (req.user) {
    authlogger.debug(req.user.name + ' passed auth-check');
    return next();
  }

  next(new AccessError(403, 'You are not authorized for that kind of resources.'));
}

module.exports = isAuthed;