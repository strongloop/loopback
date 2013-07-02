/**
 * Module Dependencies.
 */

var Model = require('../asteroid').Model
  , asteroid = require('../asteroid')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

/**
 * Default User properties.
 */

var properties = {
    id: {type: String, required: true},
    realm: {type: String},
    username: {type: String, required: true},
    password: {type: String, transient: true}, // Transient property
    hash: {type: String}, // Hash code calculated from sha256(realm, username, password, salt, macKey)
    salt: {type: String},
    macKey: {type: String}, // HMAC to calculate the hash code
    email: String,
    emailVerified: Boolean,
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
 * Extends from the built in `asteroid.Model` type.
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
  
  this.findOne({username: credentials.username}, function(err, user) {
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
    var Session = UserCtor.settings.session || asteroid.Session;
    
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
 * Compare the given `password` with the users hashed password.
 *
 * @param {String} password The plain text password
 * @returns {Boolean}
 */

User.prototype.hasPassword = function (plain, fn) {
  // TODO - bcrypt
  fn(null, this.password === plain);
}

/**
 * Override the extend method to setup any extended user models.
 */

User.extend = function () {
  var EUser = Model.extend.apply(User, arguments);
  
  setup(EUser);
  
  return EUser;
}

function setup(UserModel) {
  asteroid.remoteMethod(
    UserModel.login,
    {
      accepts: [
        {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}}
      ],
      returns: {arg: 'session', type: 'object'},
      http: {verb: 'post'}
    }
  );
  
  return UserModel;
}

setup(User);