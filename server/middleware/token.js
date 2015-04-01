/*!
 * Module dependencies.
 */

var loopback = require('../../lib/loopback');
var assert = require('assert');
var debug = require('debug')('loopback:middleware:token');

/*!
 * Export the middleware.
 */

module.exports = token;

/*
 * Rewrite the url to replace current user literal with the logged in user id
 */
function rewriteUserLiteral(req, currentUserLiteral) {
  if (req.accessToken && req.accessToken.userId && currentUserLiteral) {
    // Replace /me/ with /current-user-id/
    var urlBeforeRewrite = req.url;
    req.url = req.url.replace(
      new RegExp('/' + currentUserLiteral + '(/|$|\\?)', 'g'),
        '/' + req.accessToken.userId + '$1');
    if (req.url !== urlBeforeRewrite) {
      debug('req.url has been rewritten from %s to %s', urlBeforeRewrite,
        req.url);
    }
  }
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check for an access token in cookies, headers, and query string parameters.
 * This function always checks for the following:
 *
 * - `access_token` (params only)
 * - `X-Access-Token` (headers only)
 * - `authorization` (headers and cookies)
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
 * @property {Function|String} [model] AccessToken model name or class to use.
 * @property {String} [currentUserLiteral] String literal for the current user.
 * @header loopback.token([options])
 */

function token(options) {
  options = options || {};
  var TokenModel;

  var currentUserLiteral = options.currentUserLiteral;
  if (currentUserLiteral && (typeof currentUserLiteral !== 'string')) {
    debug('Set currentUserLiteral to \'me\' as the value is not a string.');
    currentUserLiteral = 'me';
  }
  if (typeof currentUserLiteral === 'string') {
    currentUserLiteral = escapeRegExp(currentUserLiteral);
  }

  return function(req, res, next) {
    var app = req.app;
    var registry = app.registry;
    if (!TokenModel) {
      if (registry === loopback.registry) {
        TokenModel = options.model || loopback.AccessToken;
      } else if (options.model) {
        TokenModel = registry.getModel(options.model);
      } else {
        TokenModel = registry.getModel('AccessToken');
      }
    }

    assert(typeof TokenModel === 'function',
      'loopback.token() middleware requires a AccessToken model');

    if (req.accessToken !== undefined) {
      rewriteUserLiteral(req, currentUserLiteral);
      return next();
    }
    TokenModel.findForRequest(req, options, function(err, token) {
      req.accessToken = token || null;
      rewriteUserLiteral(req, currentUserLiteral);
      var ctx = loopback.getCurrentContext();
      if (ctx) ctx.set('accessToken', token);
      next(err);
    });
  };
}
