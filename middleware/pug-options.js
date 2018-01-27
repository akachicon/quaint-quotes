function populateOptions(req, res, next) {
  let options = req.pugOptions = {};

  options.authorized = !!req.user;
  options.username = options.authorized ?
    req.user.name : 'Guest';

  next();
}

module.exports = populateOptions;
