const express = require('express'),
  quotes = express.Router(),
  Quote = require('../models/quote');

quotes.get('/:quoteId', (req, res, next) => {
  Quote.findById(req.params.quoteId).then((data) => {

  }, next);
});

module.exports = quotes;
