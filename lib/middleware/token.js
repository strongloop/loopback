/**
 * Module dependencies.
 */

var loopback = require('../loopback');
var RemoteObjects = require('strong-remoting');
var assert = require('assert');

/**
 * Export the middleware.
 */

module.exports = token;

function token(options) {
  options = options || {};
  var TokenModel = options.model || loopback.AccessToken;
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

