function populateOptions(req, res, next) {
  let options = req.pugOptions = {},
    DEFAULT_QUOTES_PER_PAGE = '25',
    DEFAULT_TOPICS_PER_PAGE = '50';

  options.authorized = !!req.user;
  options.username = options.authorized ?
    req.user.name : 'Guest';

  if (!req.session.searchFor) {
    req.session.searchFor = 'quotes';
    options.searchFor = 'quotes';
  } else
    options.searchFor = req.session.searchFor;

  if (!req.session.quotesPerPage) {
    req.session.quotesPerPage = DEFAULT_QUOTES_PER_PAGE;
    options.quotesPerPage = DEFAULT_QUOTES_PER_PAGE;
  } else
    options.quotesPerPage = req.session.quotesPerPage;

  if (!req.session.topicsPerPage) {
    req.session.topicsPerPage = DEFAULT_TOPICS_PER_PAGE;
    options.topicsPerPage = DEFAULT_TOPICS_PER_PAGE;
  } else
    options.topicsPerPage = req.session.topicsPerPage;

  next();
}

module.exports = populateOptions;
