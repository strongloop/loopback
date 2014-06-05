/*!
 * Module dependencies.
 */

var loopback = require('../loopback');
var assert = require('assert');

/*!
 * Export the middleware.
 */

module.exports = token;

/**    
 * Check for an access token in cookies, headers, and query string parameters.
 * This function always checks for the following:
 * 
 * - `access_token`
 * - `X-Access-Token`
 * - `authorization`
 *
 * It checks for these values in cookies, headers, and query string parameters _in addition_ to the items
 * specified in the options parameter.
 * 
 * **NOTE:** This function only checks for [signed cookies](http://expressjs.com/api.html#req.signedCookies).
 * 
 * The following example illustrates how to check for an `accessToken` in a custom cookie, query string parameter
 * and header called `foo-auth`.
 * 
 * ```js
 * app.use(loopback.token({
 *   cookies: ['foo-auth'],
 *   headers: ['foo-auth', 'X-Foo-Auth'],
 *   params: ['foo-auth', 'foo_auth']
 * }));
 * ```
 *
 * @options {Object} [options] Each option array is used to add additional keys to find an `accessToken` for a `request`.
 * @property {Array} [cookies] Array of cookie names.
 * @property {Array} [headers] Array of header names.
 * @property {Array} [params] Array of param names.
 * @property {Array} [model] An AccessToken object to use.
 * @header loopback.token([options])
 */

function token(options) {
  options = options || {};
  var TokenModel = options.model || loopback.AccessToken;
  assert(TokenModel, 'loopback.token() middleware requires a AccessToken model');
  
  return function (req, res, next) {
    if (req.accessToken !== undefined) return next();
    TokenModel.findForRequest(req, options, function(err, token) {
      if(err) return next(err);
      if(token) {
        req.accessToken = token;
        next();
      } else {
        req.accessToken = null;
        return next();
      }
    });
  }
}

