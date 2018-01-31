const express = require('express'),
  bodyParser = require('body-parser'),
  session = require('express-session'),
  flash = require('express-flash-2'),
  favicon = require('serve-favicon'),
  MongoStore = require('connect-mongo')(session),
  mongoose = require('mongoose'),
  passport = require('passport'),
  app = express(),
  winston = require('winston'),
  isAuthed = require('./middleware/is-authed'),
  pugOptions = require('./middleware/pug-options'),
  auth = require('./routes/auth'),
  profile = require('./routes/profile'),
  HttpError = require('./errors/http-error'),
  PORT = process.env.PORT;

require('./misc/winston-setup')();
const logger = winston.loggers.get('main-logger');

app.set('view engine', 'pug');
app.set('views', __dirname + '/templates');

mongoose.connect('mongodb://ds161833.mlab.com:61833/pvocab', {
  user: process.env.DBUSER,
  pass: process.env.DBPASSWORD,
  autoReconnect: true,
  reconnectTries: 60,
  reconnectInterval: 10000,
  // poolSize: 10,      // the maximum number of sockets the MongoDB driver will keep open for this connection (default is 5)
  // bufferMaxEntries: 0      // forbid buffering by MongoDB driver
}, (err) => {
  if (err) return logger.error(new Error('Mongoose connection establishment failed'));
  logger.debug('mongodb connection has been established');
});

app.use(favicon(__dirname + '/public/miscellaneous/favicon.ico'));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'nobodyknows',
  resave: true,
  saveUninitialized: false,       // flash unconditionally writes to session for every request
  rolling: true,
  cookie: { maxAge: 3 * 24 * 3600 * 1000 },
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 3 * 24 * 3600,
    touchAfter: 24 * 3600
  })
}));

app.use(express.static('public', {
  maxAge: 1000 * 3600 * 24 * 7      // there is 0 by default, means no-cache (not for Firefox)
}));

app.use(flash());

// Chrome makes hidden request for each .min file
// (in terms of debugging) which cause express middleware
// to be invoked redundant amount of times
app.get(/.*\.map$/i, (req, res) => {
  res.end();
});

app.use(passport.initialize());
app.use(passport.session());

logger.silly('NODE_ENV=' + process.env.NODE_ENV);
logger.silly('DBUSER=' + process.env.DBUSER);
logger.silly('DBPASSWORD=' + process.env.DBPASSWORD);
logger.silly('DEV_RECIPIENT=' + process.env.RECIPIENT);

app.get('/error', pugOptions, (req, res) => {
  req.pugOptions.statusMessage = 'Sorry!';
  req.pugOptions.clientMessage = 'Internal server error.';

  res.render('errors/http', req.pugOptions);
});

app.get('/', pugOptions, (req, res) => {
  let flash = res.locals.flash,
    options = req.pugOptions;

  for (field in flash) {
    options[field] = flash[field][0];
    logger.debug(options);
  }

  res.append('Cache-Control', 'public, no-cache');

  res.render('home', options);
});

app.use('/', auth);

app.use('/profile', pugOptions, isAuthed, profile);

app.get('/features', pugOptions, (req, res) => {
  res.render('features', req.pugOptions);
});

app.get('/termsofuse', pugOptions, (req, res) => {
  res.render('tou', req.pugOptions);
});

app.get('/contact', pugOptions, (req, res) => {
  res.render('contact', req.pugOptions);
});

app.use(pugOptions, (req, res, next) => {
  next(new HttpError(404, 'The resource does not exist.'));
});

app.use((err, req, res, next) => {
  if (err.status === 403 || err.status === 404)
    logger.warn(err);
  else
    logger.error(err);

  if (app.get('env') === 'development')
    next(err);        // to use default error handler
  else
    if (err instanceof HttpError) {
      req.pugOptions.statusMessage = err.message;
      req.pugOptions.clientMessage = err.clientMsg;
      req.pugOptions.status = err.status;

      res.status(err.status || 500).render('errors/http', req.pugOptions);
    }
    else {
      req.pugOptions.statusMessage = 'Sorry!';
      req.pugOptions.clientMessage = 'Internal server error.';

      res.status(500).render('errors/http', req.pugOptions);
    }
});

app.listen(PORT || 3000, () => {
  logger.debug('server is running');
});