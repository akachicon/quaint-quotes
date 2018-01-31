const winston = require('winston');

function setup() {
  let config = winston.config,
    formatter = function (options) {
      return config.colorize(options.level, options.level.toUpperCase()) + ' ' +
        (options.message ? options.message : '') +
        (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
    },
    loggers = [];

    let mainlogger = winston.loggers.add('main-logger');      // main logger
    authlogger = winston.loggers.add('auth-logger');          // authorization/authentication related events but not errors

  loggers.push(mainlogger, authlogger);

  loggers.forEach((logger) => {
    logger.transports.console = new winston.transports.Console({
      level: 'error',
      formatter: formatter
    });
  });

  if (process.env.NODE_ENV === 'production') return;

  if (process.argv.indexOf('--auth-log') !== -1) {
    authlogger.transports.console.level = 'silly';
    return;
  }

  if (process.argv.indexOf('--main-log') !== -1) {
    mainlogger.transports.console.level = 'silly';
    return;
  }

  loggers.forEach((logger) => {
    logger.transports.console.level = 'silly';
  });
}

module.exports = setup;


