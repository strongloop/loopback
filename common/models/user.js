// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Module Dependencies.
 */

var g = require('strong-globalize')();

var isEmail = require('isemail');
var loopback = require('../../lib/loopback');
var utils = require('../../lib/utils');
var path = require('path');
var qs = require('querystring');
var SALT_WORK_FACTOR = 10;
var crypto = require('crypto');
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
 * @property {String} realm The namespace the user belongs to. See [Partitioning users with realms](https://docs.strongloop.com/display/public/LB/Partitioning+users+with+realms) for details.
 * @property {Date} created The property is not used by LoopBack, you are free to use it for your own purposes.
 * @property {Date} lastUpdated The property is not used by LoopBack, you are free to use it for your own purposes.
 * @property {String} status The property is not used by LoopBack, you are free to use it for your own purposes.
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
   * @param {Number} ttl The requested ttl
   * @param {Object} [options] The options for access token, such as scope, appId
   * @callback {Function} cb The callback function
   * @param {String|Error} err The error string or object
   * @param {AccessToken} token The generated access token object
   */
  User.prototype.createAccessToken = function(ttl, options, cb) {
    if (cb === undefined && typeof options === 'function') {
      // createAccessToken(ttl, cb)
      cb = options;
      options = undefined;
    }

    cb = cb || utils.createPromiseCallback();

    if (typeof ttl === 'object' && !options) {
      // createAccessToken(options, cb)
      options = ttl;
      ttl = options.ttl;
    }
    options = options || {};
    var userModel = this.constructor;
    ttl = Math.min(ttl || userModel.settings.ttl, userModel.settings.maxTTL);
    this.accessTokens.create({
      ttl: ttl
    }, cb);
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
   * @param {Object} credentials username/password or email/password
   * @param {String[]|String} [include] Optionally set it to "user" to include
   * the user info
   * @callback {Function} callback Callback function
   * @param {Error} err Error object
   * @param {AccessToken} token Access token if login is successful
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
   */

  User.logout = function(tokenId, fn) {
    fn = fn || utils.createPromiseCallback();

    if (!tokenId) {
      var err = new Error(g.f('{{accessToken}} is required to logout'));
      err.status = 401;
      process.nextTick(function() { fn(err); });
      return fn.promise;
    }

    this.relations.accessTokens.modelTo.destroyById(tokenId, function(err, info) {
      if (err) {
        fn(err);
      } else if ('count' in info && info.count === 0) {
        err = new Error(g.f('Could not find {{accessToken}}'));
        err.status = 401;
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
    ctx.Model.find({ where: ctx.where, fields: [pkName] }, function(err, list) {
      if (err) return next(err);

      var ids = list.map(function(u) { return u[pkName]; });
      ctx.where = {};
      ctx.where[pkName] = { inq: ids };

      AccessToken.destroyAll({ userId: { inq: ids }}, next);
    });
  });

  /**
   * Compare the given `password` with the users hashed password.
   *
   * @param {String} password The plain text password
   * @callback {Function} callback Callback function
   * @param {Error} err Error object
   * @param {Boolean} isMatch Returns true if the given `password` matches record
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
   * Verify a user's identity by sending them a confirmation email.
   *
   * ```js
   *    var options = {
   *      type: 'email',
   *      to: user.email,
   *      template: 'verify.ejs',
   *      redirect: '/',
   *      tokenGenerator: function (user, cb) { cb("random-token"); }
   *    };
   *
   *    user.verify(options, next);
   * ```
   *
   * @options {Object} options
   * @property {String} type Must be 'email'.
   * @property {String} to Email address to which verification email is sent.
   * @property {String} from Sender email addresss, for example
   *   `'noreply@myapp.com'`.
   * @property {String} subject Subject line text.
   * @property {String} text Text of email.
   * @property {String} template Name of template that displays verification
   *  page, for example, `'verify.ejs'.
   * @property {Function} templateFn A function generating the email HTML body
   * from `verify()` options object and generated attributes like `options.verifyHref`.
   * It must accept the option object and a callback function with `(err, html)`
   * as parameters
   * @property {String} redirect Page to which user will be redirected after
   *  they verify their email, for example `'/'` for root URI.
   * @property {Function} generateVerificationToken A function to be used to
   *  generate the verification token. It must accept the user object and a
   *  callback function. This function should NOT add the token to the user
   *  object, instead simply execute the callback with the token! User saving
   *  and email sending will be handled in the `verify()` method.
   */

  User.prototype.verify = function(options, fn) {
    fn = fn || utils.createPromiseCallback();

    var user = this;
    var userModel = this.constructor;
    var registry = userModel.registry;
    var pkName = userModel.definition.idName() || 'id';
    assert(typeof options === 'object', 'options required when calling user.verify()');
    assert(options.type, 'You must supply a verification type (options.type)');
    assert(options.type === 'email', 'Unsupported verification type');
    assert(options.to || this.email, 'Must include options.to when calling user.verify() or the user must have an email property');
    assert(options.from, 'Must include options.from when calling user.verify()');

    options.redirect = options.redirect || '/';
    options.template = path.resolve(options.template || path.join(__dirname, '..', '..', 'templates', 'verify.ejs'));
    options.user = this;
    options.protocol = options.protocol || 'http';

    var app = userModel.app;
    options.host = options.host || (app && app.get('host')) || 'localhost';
    options.port = options.port || (app && app.get('port')) || 3000;
    options.restApiRoot = options.restApiRoot || (app && app.get('restApiRoot')) || '/api';

    var displayPort = (
      (options.protocol === 'http' && options.port == '80') ||
      (options.protocol === 'https' && options.port == '443')
    ) ? '' : ':' + options.port;

    var urlPath = joinUrlPath(
      options.restApiRoot,
      userModel.http.path,
      userModel.sharedClass.find('confirm', true).http.path
    );

    options.verifyHref = options.verifyHref ||
      options.protocol +
      '://' +
      options.host +
      displayPort +
      urlPath +
      '?' + qs.stringify({
        uid: '' + options.user[pkName],
        redirect: options.redirect,
      });

    options.templateFn = options.templateFn || createVerificationEmailBody;

    // Email model
    var Email = options.mailer || this.constructor.email || registry.getModelByType(loopback.Email);

    // Set a default token generation function if one is not provided
    var tokenGenerator = options.generateVerificationToken || User.generateVerificationToken;

    tokenGenerator(user, function(err, token) {
      if (err) { return fn(err); }

      user.verificationToken = token;
      user.save(function(err) {
        if (err) {
          fn(err);
        } else {
          sendEmail(user);
        }
      });
    });

    // TODO - support more verification types
    function sendEmail(user) {
      options.verifyHref += '&token=' + user.verificationToken;

      options.text = options.text || g.f('Please verify your email by opening ' +
        'this link in a web browser:\n\t%s', options.verifyHref);

      options.text = options.text.replace(/\{href\}/g, options.verifyHref);

      options.to = options.to || user.email;

      options.subject = options.subject || g.f('Thanks for Registering');

      options.headers = options.headers || {};

      options.templateFn(options, function(err, html) {
        if (err) {
          fn(err);
        } else {
          setHtmlContentAndSend(html);
        }
      });

      function setHtmlContentAndSend(html) {
        options.html = html;

        // Remove options.template to prevent rejection by certain
        // nodemailer transport plugins.
        delete options.template;

        Email.send(options, function(err, email) {
          if (err) {
            fn(err);
          } else {
            fn(null, {email: email, token: user.verificationToken, uid: user[pkName]});
          }
        });
      }
    }
    return fn.promise;
  };

  function createVerificationEmailBody(options, cb) {
    var template = loopback.template(options.template);
    var body = template(options);
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
   * @param {Function} cb The generator must pass back the new token with this function call
   */
  User.generateVerificationToken = function(user, cb) {
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
   * @property {String} email The user's email address
   * @property {String} realm The user's realm (optional)
   * @callback {Function} callback
   * @param {Error} err
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
      email: options.email
    };
    if (options.realm) {
      where.realm = options.realm;
    }
    UserModel.findOne({ where: where }, function(err, user) {
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

      user.createAccessToken(ttl, function(err, accessToken) {
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
      });
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
    if (plain && typeof plain === 'string' && plain.length <= MAX_PASSWORD_LENGTH) {
      return true;
    }
    if (plain.length > MAX_PASSWORD_LENGTH) {
      err = new Error(g.f('Password too long: %s', plain));
      err.code = 'PASSWORD_TOO_LONG';
    } else {
      err =  new Error(g.f('Invalid password: %s', plain));
      err.code = 'INVALID_PASSWORD';
    }
    err.statusCode = 422;
    throw err;
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
            'See the description of return value for more details.' },
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
        http: {verb: 'post'}
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
        http: {verb: 'all'}
      }
    );

    UserModel.remoteMethod(
      'confirm',
      {
        description: 'Confirm a user registration with email verification token.',
        accepts: [
          {arg: 'uid', type: 'string', required: true},
          {arg: 'token', type: 'string', required: true},
          {arg: 'redirect', type: 'string'}
        ],
        http: {verb: 'get', path: '/confirm'}
      }
    );

    UserModel.remoteMethod(
      'resetPassword',
      {
        description: 'Reset password for a user with email.',
        accepts: [
          {arg: 'options', type: 'object', required: true, http: {source: 'body'}}
        ],
        http: {verb: 'post', path: '/reset'}
      }
    );

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
      message: g.f('Must provide a valid email')
    });

    // FIXME: We need to add support for uniqueness of composite keys in juggler
    if (!(UserModel.settings.realmRequired || UserModel.settings.realmDelimiter)) {
      UserModel.validatesUniquenessOf('email', {message: 'Email already exists'});
      UserModel.validatesUniquenessOf('username', {message: 'User already exists'});
    }

    UserModel.once('attached', function() {
      if (UserModel.app.get('logoutSessionsOnSensitiveChanges') !== undefined)
        return;

      g.warn([
        '',
        'The user model %j is attached to an application that does not specify',
        'whether other sessions should be invalidated when a password or',
        'an email has changed. Session invalidation is important for security',
        'reasons as it allows users to recover from various account breach',
        'situations.',
        '',
        'We recommend turning this feature on by setting',
        '"{{logoutSessionsOnSensitiveChanges}}" to {{true}} in',
        '{{server/config.json}} (unless you have implemented your own solution',
        'for token invalidation).',
        '',
        'We also recommend enabling "{{injectOptionsFromRemoteContext}}" in',
        '%s\'s settings (typically via common/models/*.json file).',
        'This setting is required for the invalidation algorithm to keep ',
        'the current session valid.',
        '',
        'Learn more in our documentation at',
        'https://loopback.io/doc/en/lb2/AccessToken-invalidation.html',
        '',
      ].join('\n'), UserModel.modelName, UserModel.modelName);
    });

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

  User.observe('before save', function prepareForTokenInvalidation(ctx, next) {
    var invalidationEnabled = ctx.Model.app &&
      ctx.Model.app.get('logoutSessionsOnSensitiveChanges');
    if (!invalidationEnabled) return next();

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
    var invalidationEnabled = ctx.Model.app &&
      ctx.Model.app.get('logoutSessionsOnSensitiveChanges');
    if (!invalidationEnabled) return next();

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
  if (!isEmail(value))
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
