var utils = require('../../../lib/utils');

var DEFAULT_TTL = 1209600; // 2 weeks in seconds
var DEFAULT_RESET_PW_TTL = 15 * 60; // 15 mins in seconds
var DEFAULT_MAX_TTL = 31556926; // 1 year in seconds

var SALT_WORK_FACTOR = 10;

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

var debug = require('debug')('loopback:user:password');

module.exports = function(User) {

  User.once('setup', function(UserModel) {
    // max ttl
    UserModel.settings.maxTTL = UserModel.settings.maxTTL || DEFAULT_MAX_TTL;
    UserModel.settings.ttl = UserModel.settings.ttl || DEFAULT_TTL;

    UserModel.setter.password = function(plain) {
      if (plain.indexOf('$2a$') === 0 && plain.length === 60) {
        // The password is already hashed. It can be the case
        // when the instance is loaded from DB
        this.$password = plain;
      } else {
        this.$password = this.constructor.hashPassword(plain);
      }
    };

    UserModel.remoteMethod(
      'resetPassword',
      {
        description: 'Reset password for a user with email',
        accepts: [
          {arg: 'options', type: 'object', required: true, http: {source: 'body'}}
        ],
        http: {verb: 'post', path: '/reset'}
      }
    );

    UserModel.registry.configureModel(UserModel, {acls: [
      {
        principalType: 'ROLE',
        principalId: '$everyone',
        permission: 'ALLOW',
        accessType: 'EXECUTE',
        property: 'resetPassword'
      }
    ], dataSource: UserModel.dataSource});

  });

  /**
   * Compare the given `password` with the users hashed password.
   *
   * @param {String} password The plain text password
   * @returns {Boolean}
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

  /*!
   * Hash the plain password
   */
  User.hashPassword = function(plain) {
    this.validatePassword(plain);
    var salt = bcrypt.genSaltSync(this.settings.saltWorkFactor || SALT_WORK_FACTOR);
    return bcrypt.hashSync(plain, salt);
  };

  User.validatePassword = function(plain) {
    if (typeof plain === 'string' && plain) {
      return true;
    }
    var err =  new Error('Invalid password: ' + plain);
    err.statusCode = 422;
    throw err;
  };

  /**
   * Create a short lived acess token for temporary login. Allows users
   * to change passwords if forgotten.
   *
   * @options {Object} options
   * @prop {String} email The user's email address
   * @callback {Function} callback
   * @param {Error} err
   */

  User.resetPassword = function(options, cb) {
    cb = cb || utils.createPromiseCallback();
    var UserModel = this;
    var ttl = UserModel.settings.resetPasswordTokenTTL || DEFAULT_RESET_PW_TTL;

    options = options || {};
    if (typeof options.email === 'string') {
      UserModel.findOne({ where: {email: options.email} }, function(err, user) {
        if (err) {
          cb(err);
        } else if (user) {
          // create a short lived access token for temp login to change password
          // TODO(ritch) - eventually this should only allow password change
          user.accessTokens.create({ttl: ttl}, function(err, accessToken) {
            if (err) {
              cb(err);
            } else {
              cb();
              UserModel.emit('resetPasswordRequest', {
                email: options.email,
                accessToken: accessToken,
                user: user
              });
            }
          });
        } else {
          cb();
        }
      });
    } else {
      var err = new Error('email is required');
      err.statusCode = 400;
      err.code = 'EMAIL_REQUIRED';
      cb(err);
    }
    return cb.promise;
  };

};
