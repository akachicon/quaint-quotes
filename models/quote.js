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

  if (!Number.isInteger(skip) || !Number.isInteger(limit)
      || skip < 0
      || limit < 0
      || limit > 500) {
    logger.warn('Attempt requesting quotes collection with invalid parameters has been prevented');

    return new Promise((resolve, reject) => {
      reject(new Error('Invalid params for db request'));       // use Error to respond with 500 status
    });
  }

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