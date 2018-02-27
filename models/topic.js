const mongoose = require('mongoose'),
  winston = require('winston'),
  logger = winston.loggers.get('main-logger');

let authorSchema = new mongoose.Schema({
  name: 'string',
}, {
  minimize: false,       // allows to keep empty objects as a field values (otherwise the field won't be used)
  strict: false       // allows to store fields that are not described in the schema
});

let Topic = mongoose.model('Topic', authorSchema);

Topic.search = function (parameters) {
  let skip = +parameters.skip,
    limit = +parameters.limit;

  if (!Number.isInteger(skip) || !Number.isInteger(limit)
      || skip < 0
      || limit < 0
      || limit > 500) {
    logger.warn('Attempt requesting topics collection with invalid parameters has been prevented');

    return new Promise((resolve, reject) => {
      reject(new Error('Invalid params for db request'));       // use Error to respond with 500 status
    });
  }

  return Topic.aggregate([
    { $match: { $text: { $search: parameters.query } } },
    { $sort: { score: { $meta: "textScore" } } },
    { $skip: skip },
    { $limit: limit },
    { $project: { name: 1, _id: 0 } }
  ]);
};

module.exports = Topic;
