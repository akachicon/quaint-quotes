const http = require('http');

class HttpError extends Error {
  constructor (status, clientMsg) {
    super(http.STATUS_CODES[status] || 'Http error');
    this.status = status;
    this.clientMsg = clientMsg;
  }
}

module.exports = HttpError;
