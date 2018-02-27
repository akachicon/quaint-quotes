const express = require('express'),
  search = express.Router(),
  Author = require('../models/author'),
  Topic = require('../models/topic'),
  Quote = require('../models/quote');

// for each type of request there are such parameters as limit, skip and json (bool - to respond to auto-complete search request)

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

  console.log('before respond');

  respond(req, res, next, model, template);
});

function respond(req, res, next, model, template) {

  console.log(req.query);

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
      quote: 'No matches',
      author: 'No matches',
      topic: 'No matches'
    }];

  return data;
}

module.exports = search;