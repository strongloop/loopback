/*!
 * Module Dependencies.
 */

// ok it was about the place where it was included...
// no fancy weird scoping going on... :-)
require('./access-token'); // <<<< ok continue from there.

var PersistedModel = require('../loopback').PersistedModel
  , loopback = require('../loopback')
  , path = require('path')
  , SALT_WORK_FACTOR = 10
  , crypto = require('crypto')
  , bcrypt = require('bcryptjs')
  , DEFAULT_TTL = 1209600 // 2 weeks in seconds
  , DEFAULT_RESET_PW_TTL = 15 * 60 // 15 mins in seconds
  , DEFAULT_MAX_TTL = 31556926 // 1 year in seconds
  , Role = require('./role').Role
  , ACL = require('./acl').ACL
  , assert = require('assert');

var debug = require('debug')('loopback:user');

/*!
 * Default User properties.
 */

var properties = {
    realm: {type: String},
    username: {type: String},
    password: {type: String, required: true},
    credentials: Object, // deprecated, to be removed in 2.x
    challenges: Object, // deprecated, to be removed in 2.x
    email: {type: String, required: true},
    emailVerified: Boolean,
    verificationToken: String,
    status: String,
    created: Date,
    lastUpdated: Date
};

var options = {
  hidden: ['password'],
  acls: [
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: ACL.DENY
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: ACL.ALLOW,
      property: 'create'
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.OWNER,
      permission: ACL.ALLOW,
      property: 'deleteById'
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: ACL.ALLOW,
      property: "login"
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: ACL.ALLOW,
      property: "logout"
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.OWNER,
      permission: ACL.ALLOW,
      property: "findById"
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.OWNER,
      permission: ACL.ALLOW,
      property: "updateAttributes"
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: ACL.ALLOW,
      property: "confirm"
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: ACL.ALLOW,
      property: "resetPassword",
      accessType: ACL.EXECUTE
    }
  ],
  relations: {
    accessTokens: {
      type: 'hasMany',
      model: 'AccessToken',
      foreignKey: 'userId'
    }
  }
};

/**
 * Extends from the built in `loopback.Model` type.
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
 * @class
 * @inherits {Model}
 */

var User = module.exports = PersistedModel.extend('User', properties, options);

/**
 * Create access token for the logged in user. This method can be overridden to
 * customize how access tokens are generated
 *
 * @param [Number} ttl The requested ttl
 * @callack {Function} cb The callback function
 * @param {String|Error} err The error string or object
 * @param {AccessToken} token The generated access token object
 */
User.prototype.createAccessToken = function(ttl, cb) {
  var userModel = this.constructor;
  ttl = Math.min(ttl || userModel.settings.ttl, userModel.settings.maxTTL);
  this.accessTokens.create({
    ttl: ttl
  }, cb);
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
 * @param {Object} credentials
 * @callback {Function} callback
 * @param {Error} err
 * @param {AccessToken} token
 */

User.login = function (credentials, include, fn) {
  var self = this;
  if (typeof include === 'function') {
    fn = include;
    include = undefined;
  }

  include = (include || '');
  if (Array.isArray(include)) {
    include = include.map(function ( val ) {
      return val.toLowerCase();
    });
  }else {
    include = include.toLowerCase();
  }



  var query = {};
  if(credentials.email) {
    query.email = credentials.email;
  } else if(credentials.username) {
    query.username = credentials.username;
  } else {
    var err = new Error('username or email is required');
    err.statusCode = 400;
    return fn(err);
  }

  self.findOne({where: query}, function(err, user) {
    var defaultError = new Error('login failed');
    defaultError.statusCode = 401;

    if(err) {
      debug('An error is reported from User.findOne: %j', err);
      fn(defaultError);
    } else if(user) {
      if (self.settings.emailVerificationRequired) {
        if (!user.emailVerified) {
          // Fail to log in if email verification is not done yet
          debug('User email has not been verified');
          err = new Error('login failed as the email has not been verified');
          err.statusCode = 401;
          return fn(err);
        }
      }
      user.hasPassword(credentials.password, function(err, isMatch) {
        if(err) {
          debug('An error is reported from User.hasPassword: %j', err);
          fn(defaultError);
        } else if(isMatch) {
          user.createAccessToken(credentials.ttl, function(err, token) {
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
          });
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

User.logout = function (tokenId, fn) {
  this.relations.accessTokens.modelTo.findById(tokenId, function (err, accessToken) {
    if(err) {
      fn(err);
    } else if(accessToken) {
      accessToken.destroy(fn);
    } else {
      fn(new Error('could not find accessToken'));
    }
  });
}

/**
 * Compare the given `password` with the users hashed password.
 *
 * @param {String} password The plain text password
 * @returns {Boolean}
 */

User.prototype.hasPassword = function (plain, fn) {
  if(this.password && plain) {
    bcrypt.compare(plain, this.password, function(err, isMatch) {
      if(err) return fn(err);
      fn(null, isMatch);
    });
  } else {
    fn(null, false);
  }
}

/**
 * Verify a user's identity by sending them a confirmation email.
 *
 * ```js
 *    var options = {
 *      type: 'email',
 *      to: user.email,
 *      template: 'verify.ejs',
 *      redirect: '/'
 *    };
 *
 *    user.verify(options, next);
 * ```
 *
 * @param {Object} options
 */

User.prototype.verify = function (options, fn) {
  var user = this;
  var userModel = this.constructor;
  assert(typeof options === 'object', 'options required when calling user.verify()');
  assert(options.type, 'You must supply a verification type (options.type)');
  assert(options.type === 'email', 'Unsupported verification type');
  assert(options.to || this.email, 'Must include options.to when calling user.verify() or the user must have an email property');
  assert(options.from, 'Must include options.from when calling user.verify() or the user must have an email property');

  options.redirect = options.redirect || '/';
  options.template = path.resolve(options.template || path.join(__dirname, '..', '..', 'templates', 'verify.ejs'));
  options.user = this;
  options.protocol = options.protocol || 'http';

  var app = userModel.app;
  options.host = options.host || (app && app.get('host')) || 'localhost';
  options.port = options.port || (app && app.get('port')) || 3000;
  options.restApiRoot = options.restApiRoot ||  (app && app.get('restApiRoot')) || '/api';
  options.verifyHref = options.verifyHref ||
                       options.protocol
                       + '://'
                       + options.host
                       + ':'
                       + options.port
                       + options.restApiRoot
                       + userModel.http.path
                       + userModel.confirm.http.path
                       + '?uid='
                       + options.user.id
                       + '&redirect='
                       + options.redirect;


  // Email model
  var Email = options.mailer || this.constructor.email || loopback.getModelByType(loopback.Email);

  crypto.randomBytes(64, function(err, buf) {
    if(err) {
      fn(err);
    } else {
      user.verificationToken = buf.toString('hex');
      user.save(function (err) {
        if(err) {
          fn(err);
        } else {
          sendEmail(user);
        }
      });
    }
  });

  // TODO - support more verification types
  function sendEmail(user) {
    options.verifyHref += '&token=' + user.verificationToken;

    options.text = options.text || 'Please verify your email by opening this link in a web browser:\n\t{href}';

    options.text = options.text.replace('{href}', options.verifyHref);

    var template = loopback.template(options.template);
    Email.send({
      to: options.to || user.email,
      from: options.from,
      subject: options.subject || 'Thanks for Registering',
      text: options.text,
      html: template(options)
    }, function (err, email) {
      if(err) {
        fn(err);
      } else {
        fn(null, {email: email, token: user.verificationToken, uid: user.id});
      }
    });
  }
}


/**
 * Confirm the user's identity.
 *
 * @param {Any} userId
 * @param {String} token The validation token
 * @param {String} redirect URL to redirect the user to once confirmed
 * @callback {Function} callback
 * @param {Error} err
 */
User.confirm = function (uid, token, redirect, fn) {
  this.findById(uid, function (err, user) {
    if(err) {
      fn(err);
    } else {
      if(user && user.verificationToken === token) {
        user.verificationToken = undefined;
        user.emailVerified = true;
        user.save(function (err) {
          if(err) {
            fn(err);
          } else {
            fn();
          }
        });
      } else {
        if (user) {
          err = new Error('Invalid token: ' + token);
          err.statusCode = 400;
        } else {
          err = new Error('User not found: ' + uid);
          err.statusCode = 404;
        }
        fn(err);
      }
    }
  });
}

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
  var UserModel = this;
  var ttl = UserModel.settings.resetPasswordTokenTTL || DEFAULT_RESET_PW_TTL;

  options = options || {};
  if(typeof options.email === 'string') {
    UserModel.findOne({ where: {email: options.email} }, function(err, user) {
      if(err) {
        cb(err);
      } else if(user) {
        // create a short lived access token for temp login to change password
        // TODO(ritch) - eventually this should only allow password change
        user.accessTokens.create({ttl: ttl}, function(err, accessToken) {
          if(err) {
            cb(err);
          } else {
            cb();
            UserModel.emit('resetPasswordRequest', {
              email: options.email,
              accessToken: accessToken,
              user: user
            });
          }
        })
      } else {
        cb();
      }
    });
  } else {
    var err = new Error('email is required');
    err.statusCode = 400;

    cb(err);
  }
}

/*!
 * Setup an extended user model.
 */

User.setup = function () {
  // We need to call the base class's setup method
  PersistedModel.setup.call(this);
  var UserModel = this;

  // max ttl
  this.settings.maxTTL = this.settings.maxTTL || DEFAULT_MAX_TTL;
  this.settings.ttl = DEFAULT_TTL;

  UserModel.setter.password = function (plain) {
    var salt = bcrypt.genSaltSync(this.constructor.settings.saltWorkFactor || SALT_WORK_FACTOR);
    this.$password = bcrypt.hashSync(plain, salt);
  }

  // Make sure emailVerified is not set by creation
  UserModel.beforeRemote('create', function(ctx, user, next) {
    var body = ctx.req.body;
    if (body && body.emailVerified) {
      body.emailVerified = false;
    }
    next();
  });

  loopback.remoteMethod(
    UserModel.login,
    {
      description: 'Login a user with username/email and password',
      accepts: [
        {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}},
        {arg: 'include', type: 'string', http: {source: 'query' }, description:
          'Related objects to include in the response. ' +
            'See the description of return value for more details.'}
      ],
      returns: {
        arg: 'accessToken', type: 'object', root: true, description:
          'The response body contains properties of the AccessToken created on login.\n' +
            'Depending on the value of `include` parameter, the body may contain ' +
            'additional properties:\n\n' +
            '  - `user` - `{User}` - Data of the currently logged in user. (`include=user`)\n\n'
      },
      http: {verb: 'post'}
    }
  );

  loopback.remoteMethod(
    UserModel.logout,
    {
      description: 'Logout a user with access token',
      accepts: [
        {arg: 'access_token', type: 'string', required: true, http: function(ctx) {
          var req = ctx && ctx.req;
          var accessToken = req && req.accessToken;
          var tokenID = accessToken && accessToken.id;

          return tokenID;
        }, description:
          'Do not supply this argument, it is automatically extracted ' +
            'from request headers.'
        }
      ],
      http: {verb: 'all'}
    }
  );

  loopback.remoteMethod(
    UserModel.confirm,
    {
      description: 'Confirm a user registration with email verification token',
      accepts: [
        {arg: 'uid', type: 'string', required: true},
        {arg: 'token', type: 'string', required: true},
        {arg: 'redirect', type: 'string', required: true}
      ],
      http: {verb: 'get', path: '/confirm'}
    }
  );

  loopback.remoteMethod(
    UserModel.resetPassword,
    {
      description: 'Reset password for a user with email',
      accepts: [
        {arg: 'options', type: 'object', required: true, http: {source: 'body'}}
      ],
      http: {verb: 'post', path: '/reset'}
    }
  );

  UserModel.on('attached', function () {
    UserModel.afterRemote('confirm', function (ctx, inst, next) {
      if(ctx.req) {
        ctx.res.redirect(ctx.req.param('redirect'));
      } else {
        fn(new Error('transport unsupported'));
      }
    });
  });

  // default models
  UserModel.email = require('./email');
  UserModel.accessToken = require('./access-token');

  // email validation regex
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  UserModel.validatesUniquenessOf('email', {message: 'Email already exists'});
  UserModel.validatesFormatOf('email', {with: re, message: 'Must provide a valid email'});
  UserModel.validatesUniquenessOf('username',  {message: 'User already exists'});

  return UserModel;
}

/*!
 * Setup the base user.
 */

User.setup();
