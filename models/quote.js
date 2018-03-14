const mongoose = require('mongoose'),
  winston = require('winston'),
  logger = winston.loggers.get('main-logger');

let quoteSchema = new mongoose.Schema({
  quote: 'string',
  author: 'string',
  category: 'string',
  quote_id: 'string'
}, {
  minimize: false,       // allows to keep empty objects as a field values (otherwise the field won't be used)
  strict: false       // allows to store fields that are not described in the schema
});

let Quote = mongoose.model('Quote', quoteSchema);

Quote.search = function (parameters) {
  let skip = +parameters.skip,
    limit = +parameters.limit;

  return Quote.aggregate([
    { $match: { $text: { $search: parameters.query } } },
    { $sort: { score: { $meta: "textScore" } } },
    { $skip: skip },
    { $limit: limit },
    { $project: { quote: 1, author: 1, topic: 1, quote_id: 1, _id: 0 } }
  ]);
};

Quote.findById = function (id) {
  return Quote.findOne({ quote_id: id }).exec();
};

module.exports = Quote;