// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Module Dependencies.
 */

'use strict';
var g = require('../../lib/globalize');
var loopback = require('../../lib/loopback');
var assert = require('assert');
var uid = require('uid2');
var DEFAULT_TOKEN_LEN = 64;

/**
 * Token based authentication and access control.
 *
 * **Default ACLs**
 *
 *  - DENY EVERYONE `*`
 *  - ALLOW EVERYONE create
 *
 * @property {String} id Generated token ID.
 * @property {Number} ttl Time to live in seconds, 2 weeks by default.
 * @property {Date} created When the token was created.
 * @property {Object} settings Extends the `Model.settings` object.
 * @property {Number} settings.accessTokenIdLength Length of the base64-encoded string access token. Default value is 64.
 * Increase the length for a more secure access token.
 *
 * @class AccessToken
 * @inherits {PersistedModel}
 */

module.exports = function(AccessToken) {
  /**
   * Anonymous Token
   *
   * ```js
   * assert(AccessToken.ANONYMOUS.id === '$anonymous');
   * ```
   */

  AccessToken.ANONYMOUS = new AccessToken({id: '$anonymous'});

  /**
   * Create a cryptographically random access token id.
   *
   * @callback {Function} callback
   * @param {Error} err
   * @param {String} token
   */

  AccessToken.createAccessTokenId = function(fn) {
    uid(this.settings.accessTokenIdLength || DEFAULT_TOKEN_LEN, function(err, guid) {
      if (err) {
        fn(err);
      } else {
        fn(null, guid);
      }
    });
  };

  /*!
   * Hook to create accessToken id.
   */
  AccessToken.observe('before save', function(ctx, next) {
    if (!ctx.instance || ctx.instance.id) {
      // We are running a partial update or the instance already has an id
      return next();
    }

    AccessToken.createAccessTokenId(function(err, id) {
      if (err) return next(err);
      ctx.instance.id = id;
      next();
    });
  });

  /**
   * Extract the access token id from the HTTP request
   * @param {Request} req HTTP request object
   * @options {Object} [options] Each option array is used to add additional keys to find an `accessToken` for a `request`.
   * @property {Array} [cookies] Array of cookie names.
   * @property {Array} [headers] Array of header names.
   * @property {Array} [params] Array of param names.
   * @property {Boolean} [searchDefaultTokenKeys] Use the default search locations for Token in request
   * @property {Boolean} [bearerTokenBase64Encoded] Defaults to `true`. For `Bearer` token based `Authorization` headers,
   * decode the value from `Base64`. If set to `false`, the decoding will be skipped and the token id will be the raw value
   * parsed from the header.
   * @return {String} The access token
   */
  AccessToken.getIdForRequest = function(req, options) {
    options = options || {};
    var params = options.params || [];
    var headers = options.headers || [];
    var cookies = options.cookies || [];
    var i = 0;
    var length, id;

    // https://github.com/strongloop/loopback/issues/1326
    if (options.searchDefaultTokenKeys !== false) {
      params = params.concat(['access_token']);
      headers = headers.concat(['X-Access-Token', 'authorization']);
      cookies = cookies.concat(['access_token', 'authorization']);
    }

    for (length = params.length; i < length; i++) {
      var param = params[i];
      // replacement for deprecated req.param()
      id = req.params && req.params[param] !== undefined ? req.params[param] :
        req.body && req.body[param] !== undefined ? req.body[param] :
          req.query && req.query[param] !== undefined ? req.query[param] :
            undefined;

      if (typeof id === 'string') {
        return id;
      }
    }

    for (i = 0, length = headers.length; i < length; i++) {
      id = req.header(headers[i]);

      if (typeof id === 'string') {
        // Add support for oAuth 2.0 bearer token
        // http://tools.ietf.org/html/rfc6750
        if (id.indexOf('Bearer ') === 0) {
          id = id.substring(7);
          if (options.bearerTokenBase64Encoded) {
            // Decode from base64
            var buf = new Buffer(id, 'base64');
            id = buf.toString('utf8');
          }
        } else if (/^Basic /i.test(id)) {
          id = id.substring(6);
          id = (new Buffer(id, 'base64')).toString('utf8');
          // The spec says the string is user:pass, so if we see both parts
          // we will assume the longer of the two is the token, so we will
          // extract "a2b2c3" from:
          //   "a2b2c3"
          //   "a2b2c3:"   (curl http://a2b2c3@localhost:3000/)
          //   "token:a2b2c3" (curl http://token:a2b2c3@localhost:3000/)
          //   ":a2b2c3"
          var parts = /^([^:]*):(.*)$/.exec(id);
          if (parts) {
            id = parts[2].length > parts[1].length ? parts[2] : parts[1];
          }
        }
        return id;
      }
    }

    if (req.signedCookies) {
      for (i = 0, length = cookies.length; i < length; i++) {
        id = req.signedCookies[cookies[i]];

        if (typeof id === 'string') {
          return id;
        }
      }
    }
    return null;
  };

  /**
   * Resolve and validate the access token by id
   * @param {String} id Access token
   * @callback {Function} cb Callback function
   * @param {Error} err Error information
   * @param {Object} Resolved access token object
   */
  AccessToken.resolve = function(id, cb) {
    this.findById(id, function(err, token) {
      if (err) {
        cb(err);
      } else if (token) {
        token.validate(function(err, isValid) {
          if (err) {
            cb(err);
          } else if (isValid) {
            cb(null, token);
          } else {
            var e = new Error(g.f('Invalid Access Token'));
            e.status = e.statusCode = 401;
            e.code = 'INVALID_TOKEN';
            cb(e);
          }
        });
      } else {
        cb();
      }
    });
  };

  /**
   * Find a token for the given `ServerRequest`.
   *
   * @param {ServerRequest} req
   * @param {Object} [options] Options for finding the token
   * @callback {Function} callback
   * @param {Error} err
   * @param {AccessToken} token
   */
  AccessToken.findForRequest = function(req, options, cb) {
    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = {};
    }

    var id = this.getIdForRequest(req, options);

    if (id) {
      this.resolve(id, cb);
    } else {
      process.nextTick(cb);
    }
  };

  /**
   * Validate the token.
   *
   * @callback {Function} callback
   * @param {Error} err
   * @param {Boolean} isValid
   */
  AccessToken.prototype.validate = function(cb) {
    try {
      assert(
        this.created && typeof this.created.getTime === 'function',
        'token.created must be a valid Date'
      );
      assert(this.ttl !== 0, 'token.ttl must be not be 0');
      assert(this.ttl, 'token.ttl must exist');
      assert(this.ttl >= -1, 'token.ttl must be >= -1');

      var AccessToken = this.constructor;
      var userRelation = AccessToken.relations.user; // may not be set up
      var User = userRelation && userRelation.modelTo;

      // redefine user model if accessToken's principalType is available
      if (this.principalType) {
        User = AccessToken.registry.findModel(this.principalType);
        if (!User) {
          process.nextTick(function() {
            return cb(null, false);
          });
        }
      }

      var now = Date.now();
      var created = this.created.getTime();
      var elapsedSeconds = (now - created) / 1000;
      var secondsToLive = this.ttl;
      var eternalTokensAllowed = !!(User && User.settings.allowEternalTokens);
      var isEternalToken = secondsToLive === -1;
      var isValid = isEternalToken ?
        eternalTokensAllowed :
        elapsedSeconds < secondsToLive;

      if (isValid) {
        process.nextTick(function() {
          cb(null, isValid);
        });
      } else {
        this.destroy(function(err) {
          cb(err, isValid);
        });
      }
    } catch (e) {
      process.nextTick(function() {
        cb(e);
      });
    }
  };
};
