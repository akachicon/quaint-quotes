function isAuthed(req, res, next) {
  if (req.user) {
    console.log(req.user.name + ' passed auth-check');
    return next();
  }

  console.log(req.originalUrl);
  next(new Error('restricted resource'));       // TODO: make 'restricted resource' errors handler (may use 403 status)
}

module.exports = isAuthed;