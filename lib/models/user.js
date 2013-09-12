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
  , LocalStrategy = require('passport-local').Strategy;

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
}


/**
 * Extends from the built in `loopback.Model` type.
 */

var User = module.exports = Model.extend('user', properties);

/**
 * Login a user by with the given `credentials`.
 *
 *    User.login({username: 'foo', password: 'bar'}, function (err, session) {
 *      console.log(session.id);
 *    });
 *
 * @param {Object} credentials
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
          createSession(user, fn);
        } else {
          fn(defaultError);
        }
      });
    } else {
      fn(defaultError);
    }
  });
  
  function createSession(user, fn) {
    var Session = UserCtor.session;
    
    Session.create({uid: user.id}, function (err, session) {
      if(err) {
        fn(err);
      } else {
        fn(null, session)
      }
    });
  }
}

/**
 * Logout a user with the given session id.
 *
 *    User.logout('asd0a9f8dsj9s0s3223mk', function (err) {
 *      console.log(err || 'Logged out');
 *    });
 *
 * @param {String} sessionID
 */

User.logout = function (sid, fn) {
  var UserCtor = this;
  
  var Session = UserCtor.settings.session || loopback.Session;
  
  Session.findById(sid, function (err, session) {
    if(err) {
      fn(err);
    } else if(session) {
      session.destroy(fn);
    } else {
      fn(new Error('could not find session'));
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
 * Verify a user's identity.
 *
 *    var options = {
 *      type: 'email',
 *      to: user.email,
 *      template: 'verify.ejs',
 *      redirect: '/'
 *    };
 *
 *    user.verify(options, next);
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
 * Setup an extended user model.
 */

User.setup = function () {
  // We need to call the base class's setup method
  Model.setup.call(this);
  var UserModel = this;
  
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
      returns: {arg: 'session', type: 'object', root: true},
      http: {verb: 'post'}
    }
  );
  
  loopback.remoteMethod(
    UserModel.logout,
    {
      accepts: [
        {arg: 'sid', type: 'string', required: true}
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
  UserModel.session = require('./session');
  
  UserModel.validatesUniquenessOf('email', {message: 'Email already exists'});
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
  UserModel.validatesFormatOf('email', {with: re, message: 'Must provide a valid email'});
  
  return UserModel;
}

/*!
 * Setup the base user.
 */

User.setup();
