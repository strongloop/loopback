var expressErrorHandler = require('errorhandler');
expressErrorHandler.title = 'Loopback';

module.exports = errorHandler;

function errorHandler(options) {
  if (!options || options.includeStack !== false) {
    return expressErrorHandler(options);
  } else {
    return function errorHandler(err, req, res, next) {
      delete err.stack;
      return expressErrorHandler(options)(err, req, res, next);
    };
  }
}
