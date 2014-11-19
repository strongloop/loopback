/*!
 * Module Dependencies.
 */

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
 * @property {String} id Generated token ID
 * @property {Number} ttl Time to live in seconds, 2 weeks by default.
 * @property {Date} created When the token was created
 *
 * @class AccessToken
 * @inherits {PersistedModel}
 */

module.exports = function(AccessToken) {

  // Workaround for https://github.com/strongloop/loopback/issues/292
  AccessToken.definition.rawProperties.created.default =
  AccessToken.definition.properties.created.default = function() {
    return new Date();
  };

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

  AccessToken.beforeCreate = function(next, data) {
    data = data || {};

    AccessToken.createAccessTokenId(function(err, id) {
      if (err) {
        next(err);
      } else {
        data.id = id;

        next();
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

    var id = tokenIdForRequest(req, options);

    if (id) {
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
              var e = new Error('Invalid Access Token');
              e.status = e.statusCode = 401;
              cb(e);
            }
          });
        } else {
          cb();
        }
      });
    } else {
      process.nextTick(function() {
        cb();
      });
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

      var now = Date.now();
      var created = this.created.getTime();
      var elapsedSeconds = (now - created) / 1000;
      var secondsToLive = this.ttl;
      var isValid = elapsedSeconds < secondsToLive;

      if (isValid) {
        cb(null, isValid);
      } else {
        this.destroy(function(err) {
          cb(err, isValid);
        });
      }
    } catch (e) {
      cb(e);
    }
  };

  function tokenIdForRequest(req, options) {
    var params = options.params || [];
    var headers = options.headers || [];
    var cookies = options.cookies || [];
    var i = 0;
    var length;
    var id;

    params = params.concat(['access_token']);
    headers = headers.concat(['X-Access-Token', 'authorization']);
    cookies = cookies.concat(['access_token', 'authorization']);

    for (length = params.length; i < length; i++) {
      id = req.param(params[i]);

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
          // Decode from base64
          var buf = new Buffer(id, 'base64');
          id = buf.toString('utf8');
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
  }
};
