/**
 * Module dependencies.
 */

var loopback = require('../loopback');
var RemoteObjects = require('strong-remoting');

/**
 * Export the middleware.
 */

module.exports = token;

/**
 * 
 */

function token(app, options) {
  options = options || {};
  var tokenModelName = options.tokenModelName || 'Token';
  var TokenModel = app.getModel(tokenModelName);
  var tokenHeaderName = options.tokenHeaderName || 'X-Access-Token';
  
  return function (req, res, next) {
    next();
  }
}

