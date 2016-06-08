// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

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
 * @property {Boolean} [searchDefaultTokenKeys] Use the default search locations for Token in request
 * @property {Boolean} [enableDoublecheck] Execute middleware although an instance mounted earlier in the chain didn't find a token
 * @property {Boolean} [overwriteExistingToken] only has effect in combination with `enableDoublecheck`. If truthy, will allow to overwrite an existing accessToken.
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

  var enableDoublecheck = !!options.enableDoublecheck;
  var overwriteExistingToken = !!options.overwriteExistingToken;

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
      if (!enableDoublecheck) {
        // req.accessToken is defined already (might also be "null" or "false") and enableDoublecheck
        // has not been set --> skip searching for credentials
        rewriteUserLiteral(req, currentUserLiteral);
        return next();
      }
      if (req.accessToken && req.accessToken.id && !overwriteExistingToken) {
        // req.accessToken.id is defined, which means that some other middleware has identified a valid user.
        // when overwriteExistingToken is not set to a truthy value, skip searching for credentials.
        rewriteUserLiteral(req, currentUserLiteral);
        return next();
      }
      // continue normal operation (as if req.accessToken was undefined)
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
