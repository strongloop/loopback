var expressErrorHandler = require('errorhandler');
expressErrorHandler.title = 'Loopback';

module.exports = errorHandler;

function errorHandler(options) {
  if (!options || options.includeStack !== false) {
    return expressErrorHandler();
  } else {
    return function errorHandler(err, req, res, next) {
      delete err.stack;
      return expressErrorHandler()(err, req, res, next);
    };
  }
}
