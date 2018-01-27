const express = require('express'),
  bodyParser = require('body-parser'),
  session = require('express-session'),
  flash = require('express-flash-2'),
  favicon = require('serve-favicon'),
  MongoStore = require('connect-mongo')(session),
  mongoose = require('mongoose'),
  passport = require('passport'),
  app = express(),
  isAuthed = require('./middleware/is-authed'),
  pugOptions = require('./middleware/pug-options'),
  auth = require('./routes/auth'),
  profile = require('./routes/profile'),
  PORT = process.env.PORT;

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
  if (err) throw new Error('connection establishment failed');
  console.log('mongodb connection has been established');
});

app.use(favicon(__dirname + '/public/miscellaneous/favicon.ico'));

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
console.log(process.env.DBPASSWORD);

app.get('/', pugOptions, (req, res) => {
  let flash = res.locals.flash,
    options = req.pugOptions;

  for (field in flash) {
    console.log(options[field] = flash[field][0]);
  }

  res.append('Cache-Control', 'public, no-cache');

  res.render('home', options);
});

app.use('/', auth);

app.use('/profile', isAuthed, profile);

app.get('/features', pugOptions, (req, res) => {
  res.render('features', req.pugOptions);
});

app.get('/termsofuse', pugOptions, (req, res) => {
  res.render('tou', req.pugOptions);
});

app.get('/contact', pugOptions, (req, res) => {
  res.render('contact', req.pugOptions);
});

app.use((req, res) => {
  console.log(req.originalUrl);
  res.end();
});

app.use((err, req, res) => {
  console.log(err);
  res.status(500)
    .send('internal server error');
});

app.listen(PORT || 3000, () => {
  console.log('server is running');
});