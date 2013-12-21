/**
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback')
  , path = require('path')
  , SALT_WORK_FACTOR = 10
  , crypto = require('crypto')
  , bcrypt = require('bcryptjs')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , BaseAccessToken = require('./access-token')
  , DEFAULT_TTL = 1209600 // 2 weeks in seconds
  , DEFAULT_RESET_PW_TTL = 15 * 60 // 15 mins in seconds
  , DEFAULT_MAX_TTL = 31556926 // 1 year in seconds
  , Role = require('./role').Role
  , ACL = require('./acl').ACL;

/**
 * Default User properties.
 */

var properties = {
    realm: {type: String},
    username: {type: String},
    password: {type: String, required: true},
    email: {type: String, required: true},
    emailVerified: Boolean,
    verificationToken: String,

    credentials: [
        'UserCredential' // User credentials, private or public, such as private/public keys, Kerberos tickets, oAuth tokens, facebook, google, github ids
    ],
    challenges: [
        'Challenge' // Security questions/answers
    ],
    // https://en.wikipedia.org/wiki/Multi-factor_authentication
    /*
    factors: [
        'AuthenticationFactor'
    ],
    */
    status: String,
    created: Date,
    lastUpdated: Date
};

var options = {
  acls: [
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: ACL.DENY,
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
      property: 'removeById'
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
    }
  ]
};

/**
 * Extends from the built in `loopback.Model` type.
 *
 * Default `User` ACLs.
 * 
 * - DENY EVERYONE `*`
 * - ALLOW EVERYONE `create`
 * - ALLOW OWNER `removeById`
 * - ALLOW EVERYONE `login`
 * - ALLOW EVERYONE `logout`
 * - ALLOW EVERYONE `findById`
 * - ALLOW OWNER `updateAttributes`
 *
 * @class
 * @inherits {Model}
 */

var User = module.exports = Model.extend('User', properties, options);

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

User.login = function (credentials, fn) {
  var UserCtor = this;
  var query = {};
  
  if(credentials.email) {
    query.email = credentials.email;
  } else if(credentials.username) {
    query.username = credentials.username;
  } else {
    return fn(new Error('must provide username or email'));
  }
  
  this.findOne({where: query}, function(err, user) {
    var defaultError = new Error('login failed');
    
    if(err) {
      fn(defaultError);
    } else if(user) {
      user.hasPassword(credentials.password, function(err, isMatch) {
        if(err) {
          fn(defaultError);
        } else if(isMatch) {
          user.accessTokens.create({
            ttl: Math.min(credentials.ttl || User.settings.ttl, User.settings.maxTTL)
          }, fn);
        } else {
          fn(defaultError);
        }
      });
    } else {
      fn(defaultError);
    }
  });
}

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
  assert(typeof options === 'object', 'options required when calling user.verify()');
  assert(options.type, 'You must supply a verification type (options.type)');
  assert(options.type === 'email', 'Unsupported verification type');
  assert(options.to || this.email, 'Must include options.to when calling user.verify() or the user must have an email property');
  assert(options.from, 'Must include options.from when calling user.verify() or the user must have an email property');
  
  options.redirect = options.redirect || '/';
  options.template = path.resolve(options.template || path.join(__dirname, '..', '..', 'templates', 'verify.ejs'));
  options.user = this;
  options.protocol = options.protocol || 'http';
  options.host = options.host || 'localhost';
  options.verifyHref = options.verifyHref ||
                       options.protocol
                       + '://'
                       + options.host
                       + (User.sharedCtor.http.path || '/' + User.pluralModelName)
                       + User.confirm.http.path;
  

  
  // Email model
  var Email = options.mailer || this.constructor.email || loopback.Email;
  
  crypto.randomBytes(64, function(err, buf) {
    if(err) {
      fn(err);
    } else {
      user.verificationToken = buf.toString('base64');
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
    options.verifyHref += '?token=' + user.verificationToken;
  
    options.text = options.text || 'Please verify your email by opening this link in a web browser:\n\t{href}';
  
    options.text = options.text.replace('{href}', options.verifyHref);
    
    var template = loopback.template(options.template);
    Email.send({
      to: options.to || user.email,
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
      if(user.verificationToken === token) {
        user.verificationToken = undefined;
        user.emailVerified = true;
        user.save(function (err) {
          if(err) {
            fn(err)
          } else {
            fn();
          }
        });
      } else {
        fn(new Error('invalid token'));
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
    UserModel.findOne({email: options.email}, function(err, user) {
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
              accessToken: accessToken
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
  Model.setup.call(this);
  var UserModel = this;
  
  // max ttl
  this.settings.maxTTL = this.settings.maxTTL || DEFAULT_MAX_TTL;
  this.settings.ttl = DEFAULT_TTL;

  UserModel.setter.password = function (plain) {
    var salt = bcrypt.genSaltSync(this.constructor.settings.saltWorkFactor || SALT_WORK_FACTOR);
    this.$password = bcrypt.hashSync(plain, salt);
  }
  
  loopback.remoteMethod(
    UserModel.login,
    {
      accepts: [
        {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}}
      ],
      returns: {arg: 'accessToken', type: 'object', root: true},
      http: {verb: 'post'}
    }
  );
  
  loopback.remoteMethod(
    UserModel.logout,
    {
      accepts: [
        {arg: 'access_token', type: 'string', required: true, http: function(ctx) {
          var req = ctx && ctx.req;
          var accessToken = req && req.accessToken;
          var tokenID = accessToken && accessToken.id;

          return tokenID;
        }}
      ],
      http: {verb: 'all'}
    }
  );
  
  loopback.remoteMethod(
    UserModel.confirm,
    {
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
  
  UserModel.validatesUniquenessOf('email', {message: 'Email already exists'});
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
  UserModel.validatesFormatOf('email', {with: re, message: 'Must provide a valid email'});
  
  return UserModel;
}

/*!
 * Setup the base user.
 */

User.setup();
