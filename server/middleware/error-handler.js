var expressErrorHandler = require('errorhandler');
expressErrorHandler.title = 'Loopback';

module.exports = errorHandler;

function errorHandler(options) {
  if (!options || options.includeStack !== false) {
    return expressErrorHandler(options);
  } else {
    var baseHandler = expressErrorHandler(options);
    return function errorHandler(err, req, res, next) {
      delete err.stack;
      return baseHandler(err, req, res, next);
    };
  }
}
