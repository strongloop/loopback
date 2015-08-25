var loopback = require('../../lib/loopback');
var utils = require('../../lib/utils');

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
 * - ALLOW EVERYONE `findById`
 * - ALLOW OWNER `updateAttributes`
 *
 * @property {String} username Must be unique
 * @property {String} password Hidden from remote clients
 * @property {String} email Must be valid email
 * @property {Boolean} emailVerified Set when a user's email has been verified via `confirm()`
 * @property {String} verificationToken Set when `verify()` is called
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
 *
 * @class User
 * @inherits {PersistedModel}
 */

module.exports = function(User, options) {
  options = (options || {});

  require('./user/properties/email')(User, options);
  require('./user/properties/username')(User, options);
  require('./user/properties/password')(User, options);
  // require('./user/properties/realm')(User, options);

  require('./user/access-tokens')(User);
  require('./user/password')(User);
  require('./user/verify')(User);
  // require('./user/realm')(User);

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

    var query = {};
    if (credentials.email) {
      query.email = credentials.email;
    } else if (credentials.username) {
      query.username = credentials.username;
    }

    if (!query.email && !query.username) {
      var err2 = new Error('username or email is required');
      err2.statusCode = 400;
      err2.code = 'USERNAME_EMAIL_REQUIRED';
      fn(err2);
      return fn.promise;
    }

    self.findOne({where: query}, function(err, user) {
      var defaultError = new Error('login failed');
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
              err = new Error('login failed as the email has not been verified');
              err.statusCode = 401;
              err.code = 'LOGIN_FAILED_EMAIL_NOT_VERIFIED';
              return fn(err);
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
    this.relations.accessTokens.modelTo.findById(tokenId, function(err, accessToken) {
      if (err) {
        fn(err);
      } else if (accessToken) {
        accessToken.destroy(fn);
      } else {
        fn(new Error('could not find accessToken'));
      }
    });
    return fn.promise;
  };

  /*!
   * Setup an extended user model.
   */

  User.setup = function() {
    // We need to call the base class's setup method
    User.base.setup.call(this);
    var UserModel = this;

    UserModel.remoteMethod(
      'login',
      {
        description: 'Login a user with username/email and password.',
        accepts: [
          {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}},
          {arg: 'include', type: ['string'], http: {source: 'query' },
            description: 'Related objects to include in the response. ' +
            'See the description of return value for more details.'}
        ],
        returns: {
          arg: 'accessToken', type: 'object', root: true,
          description:
            'The response body contains properties of the AccessToken created on login.\n' +
            'Depending on the value of `include` parameter, the body may contain ' +
            'additional properties:\n\n' +
            '  - `user` - `{User}` - Data of the currently logged in user. (`include=user`)\n\n'
        },
        http: {verb: 'post'}
      }
    );

    UserModel.registry.configureModel(UserModel, {acls: [
      {
        principalType: 'ROLE',
        principalId: '$everyone',
        permission: 'ALLOW',
        property: 'login'
      },
      {
        principalType: 'ROLE',
        principalId: '$everyone',
        permission: 'ALLOW',
        property: 'logout'
      }
    ], dataSource: UserModel.dataSource});

    UserModel.remoteMethod(
      'logout',
      {
        description: 'Logout a user with access token',
        accepts: [
          {arg: 'access_token', type: 'string', required: true, http: function(ctx) {
            var req = ctx && ctx.req;
            var accessToken = req && req.accessToken;
            var tokenID = accessToken && accessToken.id;

            return tokenID;
          }, description: 'Do not supply this argument, it is automatically extracted ' +
            'from request headers.'
          }
        ],
        http: {verb: 'all'}
      }
    );

    assert(loopback.AccessToken, 'AccessToken model must be defined before User model');
    UserModel.accessToken = loopback.AccessToken;

    UserModel.emit('setup', UserModel);
    return UserModel;
  };

  /*!
   * Setup the base user.
   */

  User.setup();

};
