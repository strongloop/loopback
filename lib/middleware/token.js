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
 * **Options**
 * 
 *  - `cookies` - An `Array` of cookie names
 *  - `headers` - An `Array` of header names
 *  - `params` - An `Array` of param names
 *  - `model` - Specify an AccessToken class to use
 * 
 * Each array is used to add additional keys to find an `accessToken` for a `request`.
 * 
 * The following example illustrates how to check for an `accessToken` in a custom cookie, query string parameter
 * and header called `foo-auth`.
 * 
 * ```js
 * app.use(loopback.token({
 *   cookies: ['foo-auth'],
 *   headers: ['foo-auth', 'X-Foo-Auth'],
 *   cookies: ['foo-auth', 'foo_auth']
 * }));
 * ```
 * 
 * **Defaults**
 * 
 * By default the following names will be checked. These names are appended to any optional names. They will always
 * be checked, but any names specified will be checked first.
 * 
 * - **access_token**
 * - **X-Access-Token**
 * - **authorization**
 * - **access_token**
 * 
 * **NOTE:** The `loopback.token()` middleware will only check for [signed cookies](http://expressjs.com/api.html#req.signedCookies).
 *
 * @header loopback.token(options)
 */

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

