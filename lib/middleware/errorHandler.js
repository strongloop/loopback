var expressErrorHandler = require('express').errorHandler;
var remoting = require('strong-remoting');

/**
 * Export the middleware.
 */
module.exports = errorHandler;

/**
 * Custom error handling middleware that calls RestAdapter error handler
 * for json requests and falls back to the default express/connect handler.
 */
function errorHandler() {
  var restHandler = new remoting().adapter('rest').errorHandler();
  var fallbackHandler = expressErrorHandler();

  return function(err, req, res, next) {
    if (/json/.test(req.headers.accept || '')) {
      console.log('calling rest handler');
      restHandler(err, req, res, next);
    }
    else {
      console.log('calling fallback handler');
      fallbackHandler(err, req, res, next);
    }
  };
}

// Forward all properties like title to connect/express handler
for (var key in expressErrorHandler) {
  var prop =  Object.getOwnPropertyDescriptor(expressErrorHandler, key);
  Object.defineProperty(
    errorHandler,
    key,
    {
      get: function() { return expressErrorHandler[key]; },
      set: function(value) { expressErrorHandler[key] = value; },
      enumerable: prop.enumerable
    }
  );
}
