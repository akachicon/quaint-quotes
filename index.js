const express = require('express'),
  bodyParser = require('body-parser'),
  session = require('express-session'),
  flash = require('express-flash-2'),
  MongoStore = require('connect-mongo')(session),
  mongoose = require('mongoose'),
  passport = require('passport'),
  app = express(),
  isAuthed = require('./middleware/is-authed'),
  auth = require('./routes/auth'),
  profile = require('./routes/profile');

app.set('view engine', 'pug');
app.set('views', __dirname + '/templates');

mongoose.connect('mongodb://tidy-auth:p+vocaB_02@ds161833.mlab.com:61833/pvocab', {
  autoReconnect: true,
  reconnectTries: 60,
  reconnectInterval: 10000,
  // poolSize: 10,      // the maximum number of sockets the MongoDB driver will keep open for this connection (default is 5)
  // bufferMaxEntries: 0      // forbid buffering by MongoDB driver
}, (err) => {
  if (err) throw new Error('connection establishment failed');
  console.log('mongodb connection has been established');
});

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'nobodyknows',
  resave: true,
  saveUninitialized: false,       // flash unconditionally writes to session for every request
  rolling: true,
  cookie: { maxAge: 24 * 3600 * 1000 },
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 24 * 3600,       // default
    touchAfter: 24 * 3600
  })
}));

app.use(express.static('public', {
  maxAge: 1000 * 3600 * 24       // there is 0 by default, means no-cache (not for Firefox)
}));

app.use(flash());

// Chrome makes hidden request for each .min file
// (in terms of debugging) which cause express middleware
// to be invoked redundant amount of times
app.get(/.*\.map$/i, (req, res, next) => {
  res.end();
});

app.use(passport.initialize());
app.use(passport.session());

console.log(process.env.NODE_ENV);

app.get('/', (req, res) => {
  let flash = res.locals.flash,
    options = {};

  for (field in flash) {
    console.log(options[field] = flash[field][0]);
  }

  options.authorized = !!req.user;
  options.username = options.authorized ?
    req.user.name : 'Guest';

  res.append('Cache-Control', 'public, no-cache');

  res.render('home', options);
});

app.use('/', auth);

app.use('/profile', isAuthed, profile);

app.use((req, res) => {
  console.log(req.originalUrl);
  res.end();
});

app.use((err, req, res) => {
  console.log(err);
  res.status(500)
    .send('internal server error');
});

app.listen(3000, () => {
  console.log('server is running');
});