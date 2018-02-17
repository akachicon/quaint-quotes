const express = require('express'),
  search = express.Router(),
  Quote = require('../models/quote');

// for each type of request there are such parameters as limit, skip and json (bool - to respond to auto-complete search request)

search.get('/authors', (req, res) => {
  if (req.query.json)
    res.json(['one', 'two', 'three']);
});

search.get('/topics', (req, res) => {
  if (req.query.json)
    res.json(['one', 'two', 'three']);
});

search.get('/quotes', (req, res, next) => {
  console.log(req.query);

  Quote.search(req.query).then((data) => {
    console.log(data);

    if (req.query.autocomplete) {
      res.json(data);
    } else {
      res.end();        // TODO: render page with search results
    }
  }, next);
});

module.exports = search;