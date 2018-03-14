const express = require('express'),
  search = express.Router(),
  Author = require('../models/author'),
  Topic = require('../models/topic'),
  Quote = require('../models/quote'),
  SEARCH_AUTOCOMPLETE_RESULTS = 7,
  SEARCH_MIN_RESULTS_NUMBER = 1,
  SEARCH_MAX_RESULTS_NUMBER = 500;

// for each type of request there are such parameters as limit, skip and autocomplete

search.get('/:collection', (req, res, next) => {
  let model, template;

  switch (req.params.collection) {
    case 'authors':
      model = Author;
      break;
    case 'topics':
      model = Topic;
      break;
    case 'quotes':
      model = Quote;
      break;
    default:
      return next();
  }

  respond();

  function respond() {
    if (req.query.autocomplete) {
      req.query.skip = 0;
      req.query.limit = SEARCH_AUTOCOMPLETE_RESULTS;
    }

    model.search(req.query).then((data) => {
      data = isEmpty(data);

      if (req.query.autocomplete) {
        res.json(data);
      } else {
        res.end();        // TODO: render page with search results (use template to store path)
      }
    }, next);
  }

  function isEmpty(data) {
    if (data.length === 0)
      return [{
        quote: 'No matches'
      }];

    return data;
  }
});

search.post('/settings', (req, res) => {
  let sf = req.body.searchFor,
    qpp = req.body.quotesPerPage,
    tpp = req.body.topicsPerPage;

  if (sf === 'quotes' || sf === 'topics')
    req.session.searchFor = sf;

  if (isAllowedInt(qpp))
    req.session.quotesPerPage = qpp;

  if (isAllowedInt(tpp))
    req.session.topicsPerPage = tpp;

  res.status(200).end();

  function isAllowedInt(num) {
    num = +num;

    return Number.isInteger(num)
      && num >= SEARCH_MIN_RESULTS_NUMBER
      && num <= SEARCH_MAX_RESULTS_NUMBER;
  }
});

module.exports = search;