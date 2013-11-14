/**
 * Module dependencies.
 */

var loopback = require('../loopback');
var RemoteObjects = require('strong-remoting');

/**
 * Export the middleware.
 */

module.exports = token;

function token(app, options) {
  options = options || {};
  var tokenModelName = options.tokenModelName || 'AccessToken';
  var TokenModel = options.model;
  assert(TokenModel, 'loopback.token() middleware requires a AccessToken model');
  
  return function (req, res, next) {
    TokenModel.findForRequest(req, options, function(err, token) {
      if(err) return next(err);
      if(token) {
        req.accessToken = token;
        next();
      } else {
        return next();
      }
    });
  }
}

