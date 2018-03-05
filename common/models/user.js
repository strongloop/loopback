// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Module Dependencies.
 */

'use strict';
var g = require('../../lib/globalize');
var isEmail = require('isemail');
var loopback = require('../../lib/loopback');
var utils = require('../../lib/utils');
var path = require('path');
var qs = require('querystring');
var SALT_WORK_FACTOR = 10;
var crypto = require('crypto');
// bcrypt's max length is 72 bytes;
// See https://github.com/kelektiv/node.bcrypt.js/blob/45f498ef6dc6e8234e58e07834ce06a50ff16352/src/node_blf.h#L59
var MAX_PASSWORD_LENGTH = 72;
var bcrypt;
try {
  // Try the native module first
  bcrypt = require('bcrypt');
  // Browserify returns an empty object
  if (bcrypt && typeof bcrypt.compare !== 'function') {
    bcrypt = require('bcryptjs');
  }
} catch (err) {
  // Fall back to pure JS impl
  bcrypt = require('bcryptjs');
}

var DEFAULT_TTL = 1209600; // 2 weeks in seconds
var DEFAULT_RESET_PW_TTL = 15 * 60; // 15 mins in seconds
var DEFAULT_MAX_TTL = 31556926; // 1 year in seconds
var assert = require('assert');

var debug = require('debug')('loopback:user');

/**
 * Built-in User model.
 * Extends LoopBack [PersistedModel](#persistedmodel-new-persistedmodel).
 *
 * Default `User` ACLs.
 *
 * - DENY EVERYONE `*`
 * - ALLOW EVERYONE `create`
 * - ALLOW OWNER `deleteById`
 * - ALLOW EVERYONE `login`
 * - ALLOW EVERYONE `logout`
 * - ALLOW OWNER `findById`
 * - ALLOW OWNER `updateAttributes`
 *
 * @property {String} username Must be unique.
 * @property {String} password Hidden from remote clients.
 * @property {String} email Must be valid email.
 * @property {Boolean} emailVerified Set when a user's email has been verified via `confirm()`.
 * @property {String} verificationToken Set when `verify()` is called.
 * @property {String} realm The namespace the user belongs to. See [Partitioning users with realms](http://loopback.io/doc/en/lb2/Partitioning-users-with-realms.html) for details.
 * @property {Object} settings Extends the `Model.settings` object.
 * @property {Boolean} settings.emailVerificationRequired Require the email verification
 * process before allowing a login.
 * @property {Number} settings.ttl Default time to live (in seconds) for the `AccessToken` created by `User.login() / user.createAccessToken()`.
 * Default is `1209600` (2 weeks)
 * @property {Number} settings.maxTTL The max value a user can request a token to be alive / valid for.
 * Default is `31556926` (1 year)
 * @property {Boolean} settings.realmRequired Require a realm when logging in a user.
 * @property {String} settings.realmDelimiter When set a realm is required.
 * @property {Number} settings.resetPasswordTokenTTL Time to live for password reset `AccessToken`. Default is `900` (15 minutes).
 * @property {Number} settings.saltWorkFactor The `bcrypt` salt work factor. Default is `10`.
 * @property {Boolean} settings.caseSensitiveEmail Enable case sensitive email.
 *
 * @class User
 * @inherits {PersistedModel}
 */

module.exports = function(User) {
  /**
   * Create access token for the logged in user. This method can be overridden to
   * customize how access tokens are generated
   *
   * Supported flavours:
   *
   * ```js
   * createAccessToken(ttl, cb)
   * createAccessToken(ttl, options, cb);
   * createAccessToken(options, cb);
   * // recent addition:
   * createAccessToken(data, options, cb);
   * ```
   *
   * @options {Number|Object} [ttl|data] Either the requested ttl,
   * or an object with token properties to set (see below).
   * @property {Number} [ttl] The requested ttl
   * @property {String[]} [scopes] The access scopes granted to the token.
   * @param {Object} [options] Additional options including remoting context
   * @callback {Function} cb The callback function
   * @param {String|Error} err The error string or object
   * @param {AccessToken} token The generated access token object
   * @promise
   *
   */
  User.prototype.createAccessToken = function(ttl, options, cb) {
    if (cb === undefined && typeof options === 'function') {
      // createAccessToken(ttl, cb)
      cb = options;
      options = undefined;
    }

    cb = cb || utils.createPromiseCallback();

    let tokenData;
    if (typeof ttl !== 'object') {
      // createAccessToken(ttl[, options], cb)
      tokenData = {ttl};
    } else if (options) {
      // createAccessToken(data, options, cb)
      tokenData = ttl;
    } else {
      // createAccessToken(options, cb);
      tokenData = {};
    }

    var userSettings = this.constructor.settings;
    tokenData.ttl = Math.min(tokenData.ttl || userSettings.ttl, userSettings.maxTTL);
    this.accessTokens.create(tokenData, options, cb);
    return cb.promise;
  };

  function splitPrincipal(name, realmDelimiter) {
    var parts = [null, name];
    if (!realmDelimiter) {
      return parts;
    }
    var index = name.indexOf(realmDelimiter);
    if (index !== -1) {
      parts[0] = name.substring(0, index);
      parts[1] = name.substring(index + realmDelimiter.length);
    }
    return parts;
  }

  /**
   * Normalize the credentials
   * @param {Object} credentials The credential object
   * @param {Boolean} realmRequired
   * @param {String} realmDelimiter The realm delimiter, if not set, no realm is needed
   * @returns {Object} The normalized credential object
   */
  User.normalizeCredentials = function(credentials, realmRequired, realmDelimiter) {
    var query = {};
    credentials = credentials || {};
    if (!realmRequired) {
      if (credentials.email) {
        query.email = credentials.email;
      } else if (credentials.username) {
        query.username = credentials.username;
      }
    } else {
      if (credentials.realm) {
        query.realm = credentials.realm;
      }
      var parts;
      if (credentials.email) {
        parts = splitPrincipal(credentials.email, realmDelimiter);
        query.email = parts[1];
        if (parts[0]) {
          query.realm = parts[0];
        }
      } else if (credentials.username) {
        parts = splitPrincipal(credentials.username, realmDelimiter);
        query.username = parts[1];
        if (parts[0]) {
          query.realm = parts[0];
        }
      }
    }
    return query;
  };

  /**
   * Login a user by with the given `credentials`.
   *
   * ```js
   *    User.login({username: 'foo', password: 'bar'}, function (err, token) {
   *      console.log(token.id);
   *    });
   * ```
   *
   * If the `emailVerificationRequired` flag is set for the inherited user model
   * and the email has not yet been verified then the method will return a 401
   * error that will contain the user's id. This id can be used to call the
   * `api/verify` remote method to generate a new email verification token and
   * send back the related email to the user.
   *
   * @param {Object} credentials username/password or email/password
   * @param {String[]|String} [include] Optionally set it to "user" to include
   * the user info
   * @callback {Function} callback Callback function
   * @param {Error} err Error object
   * @param {AccessToken} token Access token if login is successful
   * @promise
   */

  User.login = function(credentials, include, fn) {
    var self = this;
    if (typeof include === 'function') {
      fn = include;
      include = undefined;
    }

    fn = fn || utils.createPromiseCallback();

    include = (include || '');
    if (Array.isArray(include)) {
      include = include.map(function(val) {
        return val.toLowerCase();
      });
    } else {
      include = include.toLowerCase();
    }

    var realmDelimiter;
    // Check if realm is required
    var realmRequired = !!(self.settings.realmRequired ||
      self.settings.realmDelimiter);
    if (realmRequired) {
      realmDelimiter = self.settings.realmDelimiter;
    }
    var query = self.normalizeCredentials(credentials, realmRequired,
      realmDelimiter);

    if (realmRequired && !query.realm) {
      var err1 = new Error(g.f('{{realm}} is required'));
      err1.statusCode = 400;
      err1.code = 'REALM_REQUIRED';
      fn(err1);
      return fn.promise;
    }
    if (!query.email && !query.username) {
      var err2 = new Error(g.f('{{username}} or {{email}} is required'));
      err2.statusCode = 400;
      err2.code = 'USERNAME_EMAIL_REQUIRED';
      fn(err2);
      return fn.promise;
    }

    self.findOne({where: query}, function(err, user) {
      var defaultError = new Error(g.f('login failed'));
      defaultError.statusCode = 401;
      defaultError.code = 'LOGIN_FAILED';

      function tokenHandler(err, token) {
        if (err) return fn(err);
        if (Array.isArray(include) ? include.indexOf('user') !== -1 : include === 'user') {
          // NOTE(bajtos) We can't set token.user here:
          //  1. token.user already exists, it's a function injected by
          //     "AccessToken belongsTo User" relation
          //  2. ModelBaseClass.toJSON() ignores own properties, thus
          //     the value won't be included in the HTTP response
          // See also loopback#161 and loopback#162
          token.__data.user = user;
        }
        fn(err, token);
      }

      if (err) {
        debug('An error is reported from User.findOne: %j', err);
        fn(defaultError);
      } else if (user) {
        user.hasPassword(credentials.password, function(err, isMatch) {
          if (err) {
            debug('An error is reported from User.hasPassword: %j', err);
            fn(defaultError);
          } else if (isMatch) {
            if (self.settings.emailVerificationRequired && !user.emailVerified) {
              // Fail to log in if email verification is not done yet
              debug('User email has not been verified');
              err = new Error(g.f('login failed as the email has not been verified'));
              err.statusCode = 401;
              err.code = 'LOGIN_FAILED_EMAIL_NOT_VERIFIED';
              err.details = {
                userId: user.id,
              };
              fn(err);
            } else {
              if (user.createAccessToken.length === 2) {
                user.createAccessToken(credentials.ttl, tokenHandler);
              } else {
                user.createAccessToken(credentials.ttl, credentials, tokenHandler);
              }
            }
          } else {
            debug('The password is invalid for user %s', query.email || query.username);
            fn(defaultError);
          }
        });
      } else {
        debug('No matching record is found for user %s', query.email || query.username);
        fn(defaultError);
      }
    });
    return fn.promise;
  };

  /**
   * Logout a user with the given accessToken id.
   *
   * ```js
   *    User.logout('asd0a9f8dsj9s0s3223mk', function (err) {
  *      console.log(err || 'Logged out');
  *    });
   * ```
   *
   * @param {String} accessTokenID
   * @callback {Function} callback
   * @param {Error} err
   * @promise
   */

  User.logout = function(tokenId, fn) {
    fn = fn || utils.createPromiseCallback();

    var err;
    if (!tokenId) {
      err = new Error(g.f('{{accessToken}} is required to logout'));
      err.statusCode = 401;
      process.nextTick(fn, err);
      return fn.promise;
    }

    this.relations.accessTokens.modelTo.destroyById(tokenId, function(err, info) {
      if (err) {
        fn(err);
      } else if ('count' in info && info.count === 0) {
        err = new Error(g.f('Could not find {{accessToken}}'));
        err.statusCode = 401;
        fn(err);
      } else {
        fn();
      }
    });
    return fn.promise;
  };

  User.observe('before delete', function(ctx, next) {
    var AccessToken = ctx.Model.relations.accessTokens.modelTo;
    var pkName = ctx.Model.definition.idName() || 'id';
    ctx.Model.find({where: ctx.where, fields: [pkName]}, function(err, list) {
      if (err) return next(err);

      var ids = list.map(function(u) { return u[pkName]; });
      ctx.where = {};
      ctx.where[pkName] = {inq: ids};

      AccessToken.destroyAll({userId: {inq: ids}}, next);
    });
  });

  /**
   * Compare the given `password` with the users hashed password.
   *
   * @param {String} password The plain text password
   * @callback {Function} callback Callback function
   * @param {Error} err Error object
   * @param {Boolean} isMatch Returns true if the given `password` matches record
   * @promise
   */

  User.prototype.hasPassword = function(plain, fn) {
    fn = fn || utils.createPromiseCallback();
    if (this.password && plain) {
      bcrypt.compare(plain, this.password, function(err, isMatch) {
        if (err) return fn(err);
        fn(null, isMatch);
      });
    } else {
      fn(null, false);
    }
    return fn.promise;
  };

  /**
   * Change this user's password.
   *
   * @param {*} userId Id of the user changing the password
   * @param {string} oldPassword Current password, required in order
   *   to strongly verify the identity of the requesting user
   * @param {string} newPassword The new password to use.
   * @param {object} [options]
   * @callback {Function} callback
   * @param {Error} err Error object
   * @promise
   */
  User.changePassword = function(userId, oldPassword, newPassword, options, cb) {
    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = undefined;
    }
    cb = cb || utils.createPromiseCallback();

    // Make sure to use the constructor of the (sub)class
    // where the method is invoked from (`this` instead of `User`)
    this.findById(userId, options, (err, inst) => {
      if (err) return cb(err);

      if (!inst) {
        const err = new Error(`User ${userId} not found`);
        Object.assign(err, {
          code: 'USER_NOT_FOUND',
          statusCode: 401,
        });
        return cb(err);
      }

      inst.changePassword(oldPassword, newPassword, options, cb);
    });

    return cb.promise;
  };

  /**
   * Change this user's password (prototype/instance version).
   *
   * @param {string} oldPassword Current password, required in order
   *   to strongly verify the identity of the requesting user
   * @param {string} newPassword The new password to use.
   * @param {object} [options]
   * @callback {Function} callback
   * @param {Error} err Error object
   * @promise
   */
  User.prototype.changePassword = function(oldPassword, newPassword, options, cb) {
    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = undefined;
    }
    cb = cb || utils.createPromiseCallback();

    this.hasPassword(oldPassword, (err, isMatch) => {
      if (err) return cb(err);
      if (!isMatch) {
        const err = new Error('Invalid current password');
        Object.assign(err, {
          code: 'INVALID_PASSWORD',
          statusCode: 400,
        });
        return cb(err);
      }

      this.setPassword(newPassword, options, cb);
    });
    return cb.promise;
  };

  /**
   * Set this user's password after a password-reset request was made.
   *
   * @param {*} userId Id of the user changing the password
   * @param {string} newPassword The new password to use.
   * @param {Object} [options] Additional options including remoting context
   * @callback {Function} callback
   * @param {Error} err Error object
   * @promise
   */
  User.setPassword = function(userId, newPassword, options, cb) {
    assert(userId != null && userId !== '', 'userId is a required argument');
    assert(!!newPassword, 'newPassword is a required argument');

    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = undefined;
    }
    cb = cb || utils.createPromiseCallback();

    // Make sure to use the constructor of the (sub)class
    // where the method is invoked from (`this` instead of `User`)
    this.findById(userId, options, (err, inst) => {
      if (err) return cb(err);

      if (!inst) {
        const err = new Error(`User ${userId} not found`);
        Object.assign(err, {
          code: 'USER_NOT_FOUND',
          statusCode: 401,
        });
        return cb(err);
      }

      inst.setPassword(newPassword, options, cb);
    });

    return cb.promise;
  };

  /**
   * Set this user's password. The callers of this method
   * must ensure the client making the request is authorized
   * to change the password, typically by providing the correct
   * current password or a password-reset token.
   *
   * @param {string} newPassword The new password to use.
   * @param {Object} [options] Additional options including remoting context
   * @callback {Function} callback
   * @param {Error} err Error object
   * @promise
   */
  User.prototype.setPassword = function(newPassword, options, cb) {
    assert(!!newPassword, 'newPassword is a required argument');

    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = undefined;
    }
    cb = cb || utils.createPromiseCallback();

    try {
      this.constructor.validatePassword(newPassword);
    } catch (err) {
      cb(err);
      return cb.promise;
    }

    // We need to modify options passed to patchAttributes, but we don't want
    // to modify the original options object passed to us by setPassword caller
    options = Object.assign({}, options);

    // patchAttributes() does not allow callers to modify the password property
    // unless "options.setPassword" is set.
    options.setPassword = true;

    const delta = {password: newPassword};
    this.patchAttributes(delta, options, (err, updated) => cb(err));

    return cb.promise;
  };

  /**
   * Returns default verification options to use when calling User.prototype.verify()
   * from remote method /user/:id/verify.
   *
   * NOTE: the User.getVerifyOptions() method can also be used to ease the
   * building of identity verification options.
   *
   * ```js
   * var verifyOptions = MyUser.getVerifyOptions();
   * user.verify(verifyOptions);
   * ```
   *
   * This is the full list of possible params, with example values
   *
   * ```js
   * {
   *   type: 'email',
   *   mailer: {
   *     send(verifyOptions, options, cb) {
   *       // send the email
   *       cb(err, result);
   *     }
   *   },
   *   to: 'test@email.com',
   *   from: 'noreply@email.com'
   *   subject: 'verification email subject',
   *   text: 'Please verify your email by opening this link in a web browser',
   *   headers: {'Mime-Version': '1.0'},
   *   template: 'path/to/template.ejs',
   *   templateFn: function(verifyOptions, options, cb) {
   *     cb(null, 'some body template');
   *   }
   *   redirect: '/',
   *   verifyHref: 'http://localhost:3000/api/user/confirm',
   *   host: 'localhost'
   *   protocol: 'http'
   *   port: 3000,
   *   restApiRoot= '/api',
   *   generateVerificationToken: function (user, options, cb) {
   *     cb(null, 'random-token');
   *   }
   * }
   * ```
   *
   * NOTE: param `to` internally defaults to user's email but can be overriden for
   * test purposes or advanced customization.
   *
   * Static default params can be modified in your custom user model json definition
   * using `settings.verifyOptions`. Any default param can be programmatically modified
   * like follows:
   *
   * ```js
   * customUserModel.getVerifyOptions = function() {
   *   const base = MyUser.base.getVerifyOptions();
   *   return Object.assign({}, base, {
   *     // custom values
   *   });
   * }
   * ```
   *
   * Usually you should only require to modify a subset of these params
   * See `User.verify()` and `User.prototype.verify()` doc for params reference
   * and their default values.
   */

  User.getVerifyOptions = function() {
    const defaultOptions = {
      type: 'email',
      from: 'noreply@example.com',
    };
    return Object.assign({}, this.settings.verifyOptions || defaultOptions);
  };

  /**
   * Verify a user's identity by sending them a confirmation message.
   * NOTE: Currently only email verification is supported
   *
   * ```js
   * var verifyOptions = {
   *   type: 'email',
   *   from: 'noreply@example.com'
   *   template: 'verify.ejs',
   *   redirect: '/',
   *   generateVerificationToken: function (user, options, cb) {
   *     cb('random-token');
   *   }
   * };
   *
   * user.verify(verifyOptions);
   * ```
   *
   * NOTE: the User.getVerifyOptions() method can also be used to ease the
   * building of identity verification options.
   *
   * ```js
   * var verifyOptions = MyUser.getVerifyOptions();
   * user.verify(verifyOptions);
   * ```
   *
   * @options {Object} verifyOptions
   * @property {String} type Must be `'email'` in the current implementation.
   * @property {Function} mailer A mailer function with a static `.send() method.
   *  The `.send()` method must accept the verifyOptions object, the method's
   *  remoting context options object and a callback function with `(err, email)`
   *  as parameters.
   *  Defaults to provided `userModel.email` function, or ultimately to LoopBack's
   *  own mailer function.
   * @property {String} to Email address to which verification email is sent.
   *  Defaults to user's email. Can also be overriden to a static value for test
   *  purposes.
   * @property {String} from Sender email address
   *  For example `'noreply@example.com'`.
   * @property {String} subject Subject line text.
   *  Defaults to `'Thanks for Registering'` or a local equivalent.
   * @property {String} text Text of email.
   *  Defaults to `'Please verify your email by opening this link in a web browser:`
   *  followed by the verify link.
   * @property {Object} headers Email headers. None provided by default.
   * @property {String} template Relative path of template that displays verification
   *  page. Defaults to `'../../templates/verify.ejs'`.
   * @property {Function} templateFn A function generating the email HTML body
   *  from `verify()` options object and generated attributes like `options.verifyHref`.
   *  It must accept the verifyOptions object, the method's remoting context options
   *  object and a callback function with `(err, html)` as parameters.
   *  A default templateFn function is provided, see `createVerificationEmailBody()`
   *  for implementation details.
   * @property {String} redirect Page to which user will be redirected after
   *  they verify their email. Defaults to `'/'`.
   * @property {String} verifyHref The link to include in the user's verify message.
   *  Defaults to an url analog to:
   *  `http://host:port/restApiRoot/userRestPath/confirm?uid=userId&redirect=/``
   * @property {String} host The API host. Defaults to app's host or `localhost`.
   * @property {String} protocol The API protocol. Defaults to `'http'`.
   * @property {Number} port The API port. Defaults to app's port or `3000`.
   * @property {String} restApiRoot The API root path. Defaults to app's restApiRoot
   *  or `'/api'`
   * @property {Function} generateVerificationToken A function to be used to
   *  generate the verification token.
   *  It must accept the verifyOptions object, the method's remoting context options
   *  object and a callback function with `(err, hexStringBuffer)` as parameters.
   *  This function should NOT add the token to the user object, instead simply
   *  execute the callback with the token! User saving and email sending will be
   *  handled in the `verify()` method.
   *  A default token generation function is provided, see `generateVerificationToken()`
   *  for implementation details.
   * @callback {Function} cb Callback function.
   * @param {Object} options remote context options.
   * @param {Error} err Error object.
   * @param {Object} object Contains email, token, uid.
   * @promise
   */

  User.prototype.verify = function(verifyOptions, options, cb) {
    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = undefined;
    }
    cb = cb || utils.createPromiseCallback();

    var user = this;
    var userModel = this.constructor;
    var registry = userModel.registry;
    verifyOptions = Object.assign({}, verifyOptions);
    // final assertion is performed once all options are assigned
    assert(typeof verifyOptions === 'object',
      'verifyOptions object param required when calling user.verify()');

    // Shallow-clone the options object so that we don't override
    // the global default options object
    verifyOptions = Object.assign({}, verifyOptions);

    // Set a default template generation function if none provided
    verifyOptions.templateFn = verifyOptions.templateFn || createVerificationEmailBody;

    // Set a default token generation function if none provided
    verifyOptions.generateVerificationToken = verifyOptions.generateVerificationToken ||
      User.generateVerificationToken;

    // Set a default mailer function if none provided
    verifyOptions.mailer = verifyOptions.mailer || userModel.email ||
      registry.getModelByType(loopback.Email);

    var pkName = userModel.definition.idName() || 'id';
    verifyOptions.redirect = verifyOptions.redirect || '/';
    var defaultTemplate = path.join(__dirname, '..', '..', 'templates', 'verify.ejs');
    verifyOptions.template = path.resolve(verifyOptions.template || defaultTemplate);
    verifyOptions.user = user;
    verifyOptions.protocol = verifyOptions.protocol || 'http';

    var app = userModel.app;
    verifyOptions.host = verifyOptions.host || (app && app.get('host')) || 'localhost';
    verifyOptions.port = verifyOptions.port || (app && app.get('port')) || 3000;
    verifyOptions.restApiRoot = verifyOptions.restApiRoot || (app && app.get('restApiRoot')) || '/api';

    var displayPort = (
      (verifyOptions.protocol === 'http' && verifyOptions.port == '80') ||
      (verifyOptions.protocol === 'https' && verifyOptions.port == '443')
    ) ? '' : ':' + verifyOptions.port;

    var urlPath = joinUrlPath(
      verifyOptions.restApiRoot,
      userModel.http.path,
      userModel.sharedClass.findMethodByName('confirm').http.path
    );

    verifyOptions.verifyHref = verifyOptions.verifyHref ||
      verifyOptions.protocol +
      '://' +
      verifyOptions.host +
      displayPort +
      urlPath +
      '?' + qs.stringify({
        uid: '' + verifyOptions.user[pkName],
        redirect: verifyOptions.redirect,
      });

    verifyOptions.to = verifyOptions.to || user.email;
    verifyOptions.subject = verifyOptions.subject || g.f('Thanks for Registering');
    verifyOptions.headers = verifyOptions.headers || {};

    // assert the verifyOptions params that might have been badly defined
    assertVerifyOptions(verifyOptions);

    // argument "options" is passed depending on verifyOptions.generateVerificationToken function requirements
    var tokenGenerator = verifyOptions.generateVerificationToken;
    if (tokenGenerator.length == 3) {
      tokenGenerator(user, options, addTokenToUserAndSave);
    } else {
      tokenGenerator(user, addTokenToUserAndSave);
    }

    function addTokenToUserAndSave(err, token) {
      if (err) return cb(err);
      user.verificationToken = token;
      user.save(options, function(err) {
        if (err) return cb(err);
        sendEmail(user);
      });
    }

    // TODO - support more verification types
    function sendEmail(user) {
      verifyOptions.verifyHref += '&token=' + user.verificationToken;
      verifyOptions.verificationToken = user.verificationToken;
      verifyOptions.text = verifyOptions.text || g.f('Please verify your email by opening ' +
        'this link in a web browser:\n\t%s', verifyOptions.verifyHref);
      verifyOptions.text = verifyOptions.text.replace(/\{href\}/g, verifyOptions.verifyHref);

      // argument "options" is passed depending on templateFn function requirements
      var templateFn = verifyOptions.templateFn;
      if (templateFn.length == 3) {
        templateFn(verifyOptions, options, setHtmlContentAndSend);
      } else {
        templateFn(verifyOptions, setHtmlContentAndSend);
      }

      function setHtmlContentAndSend(err, html) {
        if (err) return cb(err);

        verifyOptions.html = html;

        // Remove verifyOptions.template to prevent rejection by certain
        // nodemailer transport plugins.
        delete verifyOptions.template;

        // argument "options" is passed depending on Email.send function requirements
        var Email = verifyOptions.mailer;
        if (Email.send.length == 3) {
          Email.send(verifyOptions, options, handleAfterSend);
        } else {
          Email.send(verifyOptions, handleAfterSend);
        }

        function handleAfterSend(err, email) {
          if (err) return cb(err);
          cb(null, {email: email, token: user.verificationToken, uid: user[pkName]});
        }
      }
    }

    return cb.promise;
  };

  function assertVerifyOptions(verifyOptions) {
    assert(verifyOptions.type, 'You must supply a verification type (verifyOptions.type)');
    assert(verifyOptions.type === 'email', 'Unsupported verification type');
    assert(verifyOptions.to, 'Must include verifyOptions.to when calling user.verify() ' +
      'or the user must have an email property');
    assert(verifyOptions.from, 'Must include verifyOptions.from when calling user.verify()');
    assert(typeof verifyOptions.templateFn === 'function',
      'templateFn must be a function');
    assert(typeof verifyOptions.generateVerificationToken === 'function',
      'generateVerificationToken must be a function');
    assert(verifyOptions.mailer, 'A mailer function must be provided');
    assert(typeof verifyOptions.mailer.send === 'function', 'mailer.send must be a function ');
  }

  function createVerificationEmailBody(verifyOptions, options, cb) {
    var template = loopback.template(verifyOptions.template);
    var body = template(verifyOptions);
    cb(null, body);
  }

  /**
   * A default verification token generator which accepts the user the token is
   * being generated for and a callback function to indicate completion.
   * This one uses the crypto library and 64 random bytes (converted to hex)
   * for the token. When used in combination with the user.verify() method this
   * function will be called with the `user` object as it's context (`this`).
   *
   * @param {object} user The User this token is being generated for.
   * @param {object} options remote context options.
   * @param {Function} cb The generator must pass back the new token with this function call.
   */
  User.generateVerificationToken = function(user, options, cb) {
    crypto.randomBytes(64, function(err, buf) {
      cb(err, buf && buf.toString('hex'));
    });
  };

  /**
   * Confirm the user's identity.
   *
   * @param {Any} userId
   * @param {String} token The validation token
   * @param {String} redirect URL to redirect the user to once confirmed
   * @callback {Function} callback
   * @param {Error} err
   * @promise
   */
  User.confirm = function(uid, token, redirect, fn) {
    fn = fn || utils.createPromiseCallback();
    this.findById(uid, function(err, user) {
      if (err) {
        fn(err);
      } else {
        if (user && user.verificationToken === token) {
          user.verificationToken = null;
          user.emailVerified = true;
          user.save(function(err) {
            if (err) {
              fn(err);
            } else {
              fn();
            }
          });
        } else {
          if (user) {
            err = new Error(g.f('Invalid token: %s', token));
            err.statusCode = 400;
            err.code = 'INVALID_TOKEN';
          } else {
            err = new Error(g.f('User not found: %s', uid));
            err.statusCode = 404;
            err.code = 'USER_NOT_FOUND';
          }
          fn(err);
        }
      }
    });
    return fn.promise;
  };

  /**
   * Create a short lived access token for temporary login. Allows users
   * to change passwords if forgotten.
   *
   * @options {Object} options
   * @prop {String} email The user's email address
   * @property {String} realm The user's realm (optional)
   * @callback {Function} callback
   * @param {Error} err
   * @promise
   */

  User.resetPassword = function(options, cb) {
    cb = cb || utils.createPromiseCallback();
    var UserModel = this;
    var ttl = UserModel.settings.resetPasswordTokenTTL || DEFAULT_RESET_PW_TTL;
    options = options || {};
    if (typeof options.email !== 'string') {
      var err = new Error(g.f('Email is required'));
      err.statusCode = 400;
      err.code = 'EMAIL_REQUIRED';
      cb(err);
      return cb.promise;
    }

    try {
      if (options.password) {
        UserModel.validatePassword(options.password);
      }
    } catch (err) {
      return cb(err);
    }
    var where = {
      email: options.email,
    };
    if (options.realm) {
      where.realm = options.realm;
    }
    UserModel.findOne({where: where}, function(err, user) {
      if (err) {
        return cb(err);
      }
      if (!user) {
        err = new Error(g.f('Email not found'));
        err.statusCode = 404;
        err.code = 'EMAIL_NOT_FOUND';
        return cb(err);
      }
      // create a short lived access token for temp login to change password
      // TODO(ritch) - eventually this should only allow password change
      if (UserModel.settings.emailVerificationRequired && !user.emailVerified) {
        err = new Error(g.f('Email has not been verified'));
        err.statusCode = 401;
        err.code = 'RESET_FAILED_EMAIL_NOT_VERIFIED';
        return cb(err);
      }

      if (UserModel.settings.restrictResetPasswordTokenScope) {
        const tokenData = {
          ttl: ttl,
          scopes: ['reset-password'],
        };
        user.createAccessToken(tokenData, options, onTokenCreated);
      } else {
        // We need to preserve backwards-compatibility with
        // user-supplied implementations of "createAccessToken"
        // that may not support "options" argument (we have such
        // examples in our test suite).
        user.createAccessToken(ttl, onTokenCreated);
      }

      function onTokenCreated(err, accessToken) {
        if (err) {
          return cb(err);
        }
        cb();
        UserModel.emit('resetPasswordRequest', {
          email: options.email,
          accessToken: accessToken,
          user: user,
          options: options,
        });
      }
    });

    return cb.promise;
  };

  /*!
   * Hash the plain password
   */
  User.hashPassword = function(plain) {
    this.validatePassword(plain);
    var salt = bcrypt.genSaltSync(this.settings.saltWorkFactor || SALT_WORK_FACTOR);
    return bcrypt.hashSync(plain, salt);
  };

  User.validatePassword = function(plain) {
    var err;
    if (!plain || typeof plain !== 'string') {
      err = new Error(g.f('Invalid password.'));
      err.code = 'INVALID_PASSWORD';
      err.statusCode = 422;
      throw err;
    }

    // Bcrypt only supports up to 72 bytes; the rest is silently dropped.
    var len = Buffer.byteLength(plain, 'utf8');
    if (len > MAX_PASSWORD_LENGTH) {
      err = new Error(g.f('The password entered was too long. Max length is %d (entered %d)',
        MAX_PASSWORD_LENGTH, len));
      err.code = 'PASSWORD_TOO_LONG';
      err.statusCode = 422;
      throw err;
    }
  };

  User._invalidateAccessTokensOfUsers = function(userIds, options, cb) {
    if (typeof options === 'function' && cb === undefined) {
      cb = options;
      options = {};
    }

    if (!Array.isArray(userIds) || !userIds.length)
      return process.nextTick(cb);

    var accessTokenRelation = this.relations.accessTokens;
    if (!accessTokenRelation)
      return process.nextTick(cb);

    var AccessToken = accessTokenRelation.modelTo;
    var query = {userId: {inq: userIds}};
    var tokenPK = AccessToken.definition.idName() || 'id';
    if (options.accessToken && tokenPK in options.accessToken) {
      query[tokenPK] = {neq: options.accessToken[tokenPK]};
    }
    // add principalType in AccessToken.query if using polymorphic relations
    // between AccessToken and User
    var relatedUser = AccessToken.relations.user;
    var isRelationPolymorphic = relatedUser && relatedUser.polymorphic &&
      !relatedUser.modelTo;
    if (isRelationPolymorphic) {
      query.principalType = this.modelName;
    }
    AccessToken.deleteAll(query, options, cb);
  };

  /*!
   * Setup an extended user model.
   */

  User.setup = function() {
    // We need to call the base class's setup method
    User.base.setup.call(this);
    var UserModel = this;

    // max ttl
    this.settings.maxTTL = this.settings.maxTTL || DEFAULT_MAX_TTL;
    this.settings.ttl = this.settings.ttl || DEFAULT_TTL;

    UserModel.setter.email = function(value) {
      if (!UserModel.settings.caseSensitiveEmail) {
        this.$email = value.toLowerCase();
      } else {
        this.$email = value;
      }
    };

    UserModel.setter.password = function(plain) {
      if (typeof plain !== 'string') {
        return;
      }
      if (plain.indexOf('$2a$') === 0 && plain.length === 60) {
        // The password is already hashed. It can be the case
        // when the instance is loaded from DB
        this.$password = plain;
      } else {
        this.$password = this.constructor.hashPassword(plain);
      }
    };

    // Make sure emailVerified is not set by creation
    UserModel.beforeRemote('create', function(ctx, user, next) {
      var body = ctx.req.body;
      if (body && body.emailVerified) {
        body.emailVerified = false;
      }
      next();
    });

    UserModel.remoteMethod(
      'login',
      {
        description: 'Login a user with username/email and password.',
        accepts: [
          {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}},
          {arg: 'include', type: ['string'], http: {source: 'query'},
            description: 'Related objects to include in the response. ' +
            'See the description of return value for more details.'},
        ],
        returns: {
          arg: 'accessToken', type: 'object', root: true,
          description:
            g.f('The response body contains properties of the {{AccessToken}} created on login.\n' +
            'Depending on the value of `include` parameter, the body may contain ' +
            'additional properties:\n\n' +
            '  - `user` - `U+007BUserU+007D` - Data of the currently logged in user. ' +
            '{{(`include=user`)}}\n\n'),
        },
        http: {verb: 'post'},
      }
    );

    UserModel.remoteMethod(
      'logout',
      {
        description: 'Logout a user with access token.',
        accepts: [
          {arg: 'access_token', type: 'string', http: function(ctx) {
            var req = ctx && ctx.req;
            var accessToken = req && req.accessToken;
            var tokenID = accessToken ? accessToken.id : undefined;

            return tokenID;
          }, description: 'Do not supply this argument, it is automatically extracted ' +
            'from request headers.',
          },
        ],
        http: {verb: 'all'},
      }
    );

    UserModel.remoteMethod(
      'prototype.verify',
      {
        description: 'Trigger user\'s identity verification with configured verifyOptions',
        accepts: [
          {arg: 'verifyOptions', type: 'object', http: ctx => this.getVerifyOptions()},
          {arg: 'options', type: 'object', http: 'optionsFromRequest'},
        ],
        http: {verb: 'post'},
      }
    );

    UserModel.remoteMethod(
      'confirm',
      {
        description: 'Confirm a user registration with identity verification token.',
        accepts: [
          {arg: 'uid', type: 'string', required: true},
          {arg: 'token', type: 'string', required: true},
          {arg: 'redirect', type: 'string'},
        ],
        http: {verb: 'get', path: '/confirm'},
      }
    );

    UserModel.remoteMethod(
      'resetPassword',
      {
        description: 'Reset password for a user with email.',
        accepts: [
          {arg: 'options', type: 'object', required: true, http: {source: 'body'}},
        ],
        http: {verb: 'post', path: '/reset'},
      }
    );

    UserModel.remoteMethod(
      'changePassword',
      {
        description: 'Change a user\'s password.',
        accepts: [
          {arg: 'id', type: 'any', http: getUserIdFromRequestContext},
          {arg: 'oldPassword', type: 'string', required: true, http: {source: 'form'}},
          {arg: 'newPassword', type: 'string', required: true, http: {source: 'form'}},
          {arg: 'options', type: 'object', http: 'optionsFromRequest'},
        ],
        http: {verb: 'POST', path: '/change-password'},
      }
    );

    const setPasswordScopes = UserModel.settings.restrictResetPasswordTokenScope ?
      ['reset-password'] : undefined;

    UserModel.remoteMethod(
      'setPassword',
      {
        description: 'Reset user\'s password via a password-reset token.',
        accepts: [
          {arg: 'id', type: 'any', http: getUserIdFromRequestContext},
          {arg: 'newPassword', type: 'string', required: true, http: {source: 'form'}},
          {arg: 'options', type: 'object', http: 'optionsFromRequest'},
        ],
        accessScopes: setPasswordScopes,
        http: {verb: 'POST', path: '/reset-password'},
      }
    );

    function getUserIdFromRequestContext(ctx) {
      const token = ctx.req.accessToken;
      if (!token) return;

      const hasPrincipalType = 'principalType' in token;
      if (hasPrincipalType && token.principalType !== UserModel.modelName) {
        // We have multiple user models related to the same access token model
        // and the token used to authorize reset-password request was created
        // for a different user model.
        const err = new Error(g.f('Access Denied'));
        err.statusCode = 403;
        throw err;
      }

      return token.userId;
    }

    UserModel.afterRemote('confirm', function(ctx, inst, next) {
      if (ctx.args.redirect !== undefined) {
        if (!ctx.res) {
          return next(new Error(g.f('The transport does not support HTTP redirects.')));
        }
        ctx.res.location(ctx.args.redirect);
        ctx.res.status(302);
      }
      next();
    });

    // default models
    assert(loopback.Email, 'Email model must be defined before User model');
    UserModel.email = loopback.Email;

    assert(loopback.AccessToken, 'AccessToken model must be defined before User model');
    UserModel.accessToken = loopback.AccessToken;

    UserModel.validate('email', emailValidator, {
      message: g.f('Must provide a valid email'),
    });

    // Realm users validation
    if (UserModel.settings.realmRequired && UserModel.settings.realmDelimiter) {
      UserModel.validatesUniquenessOf('email', {
        message: 'Email already exists',
        scopedTo: ['realm'],
      });
      UserModel.validatesUniquenessOf('username', {
        message: 'User already exists',
        scopedTo: ['realm'],
      });
    } else {
      // Regular(Non-realm) users validation
      UserModel.validatesUniquenessOf('email', {message: 'Email already exists'});
      UserModel.validatesUniquenessOf('username', {message: 'User already exists'});
    }

    return UserModel;
  };

  /*!
   * Setup the base user.
   */

  User.setup();

  // --- OPERATION HOOKS ---
  //
  // Important: Operation hooks are inherited by subclassed models,
  // therefore they must be registered outside of setup() function

  // Access token to normalize email credentials
  User.observe('access', function normalizeEmailCase(ctx, next) {
    if (!ctx.Model.settings.caseSensitiveEmail && ctx.query.where &&
        ctx.query.where.email && typeof(ctx.query.where.email) === 'string') {
      ctx.query.where.email = ctx.query.where.email.toLowerCase();
    }
    next();
  });

  User.observe('before save', function rejectInsecurePasswordChange(ctx, next) {
    const UserModel = ctx.Model;
    if (!UserModel.settings.rejectPasswordChangesViaPatchOrReplace) {
      // In legacy password flow, any DAO method can change the password
      return next();
    }

    if (ctx.isNewInstance) {
      // The password can be always set when creating a new User instance
      return next();
    }
    const data = ctx.data || ctx.instance;
    const isPasswordChange = 'password' in data;

    // This is the option set by `setPassword()` API
    // when calling `this.patchAttritubes()` to change user's password
    if (ctx.options.setPassword) {
      // Verify that only the password is changed and nothing more or less.
      if (Object.keys(data).length > 1 || !isPasswordChange) {
        // This is a programmer's error, use the default status code 500
        return next(new Error(
          'Invalid use of "options.setPassword". Only "password" can be ' +
          'changed when using this option.'));
      }

      return next();
    }

    if (!isPasswordChange) {
      return next();
    }

    const err = new Error(
      'Changing user password via patch/replace API is not allowed. ' +
      'Use changePassword() or setPassword() instead.');
    err.statusCode = 401;
    err.code = 'PASSWORD_CHANGE_NOT_ALLOWED';
    next(err);
  });

  User.observe('before save', function prepareForTokenInvalidation(ctx, next) {
    if (ctx.isNewInstance) return next();
    if (!ctx.where && !ctx.instance) return next();

    var pkName = ctx.Model.definition.idName() || 'id';
    var where = ctx.where;
    if (!where) {
      where = {};
      where[pkName] = ctx.instance[pkName];
    }

    ctx.Model.find({where: where}, ctx.options, function(err, userInstances) {
      if (err) return next(err);
      ctx.hookState.originalUserData = userInstances.map(function(u) {
        var user = {};
        user[pkName] = u[pkName];
        user.email = u.email;
        user.password = u.password;
        return user;
      });
      var emailChanged;
      if (ctx.instance) {
        emailChanged = ctx.instance.email !== ctx.hookState.originalUserData[0].email;
        if (emailChanged && ctx.Model.settings.emailVerificationRequired) {
          ctx.instance.emailVerified = false;
        }
      } else if (ctx.data.email) {
        emailChanged = ctx.hookState.originalUserData.some(function(data) {
          return data.email != ctx.data.email;
        });
        if (emailChanged && ctx.Model.settings.emailVerificationRequired) {
          ctx.data.emailVerified = false;
        }
      }

      next();
    });
  });

  User.observe('after save', function invalidateOtherTokens(ctx, next) {
    if (!ctx.instance && !ctx.data) return next();
    if (!ctx.hookState.originalUserData) return next();

    var pkName = ctx.Model.definition.idName() || 'id';
    var newEmail = (ctx.instance || ctx.data).email;
    var newPassword = (ctx.instance || ctx.data).password;

    if (!newEmail && !newPassword) return next();

    var userIdsToExpire = ctx.hookState.originalUserData.filter(function(u) {
      return (newEmail && u.email !== newEmail) ||
        (newPassword && u.password !== newPassword);
    }).map(function(u) {
      return u[pkName];
    });
    ctx.Model._invalidateAccessTokensOfUsers(userIdsToExpire, ctx.options, next);
  });
};

function emailValidator(err, done) {
  var value = this.email;
  if (value == null)
    return;
  if (typeof value !== 'string')
    return err('string');
  if (value === '') return;
  if (!isEmail.validate(value))
    return err('email');
}

function joinUrlPath(args) {
  var result = arguments[0];
  for (var ix = 1; ix < arguments.length; ix++) {
    var next = arguments[ix];
    result += result[result.length - 1] === '/' && next[0] === '/' ?
      next.slice(1) : next;
  }
  return result;
}
