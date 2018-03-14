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

  return Topic.aggregate([
    { $match: { $text: { $search: parameters.query } } },
    { $sort: { score: { $meta: "textScore" } } },
    { $skip: skip },
    { $limit: limit },
    { $project: { name: 1, _id: 0 } }
  ]);
};

module.exports = Topic;
