var expressErrorHandler = require('errorhandler');
expressErrorHandler.title = 'Loopback';

module.exports = errorHandler;

function errorHandler() {
  if (process.env.NODE_ENV === 'production') {
    return function errorHandler(err, req, res, next) {
      delete err.stack;
      return expressErrorHandler()(err, req, res, next);
    };
  }
  return expressErrorHandler();
}
