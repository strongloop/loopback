var loopback = require('../loopback');
var DataModel = require('./data-model');
var Role = require('./role').Role;
var ACL = require('./acl').ACL;

/*!
 * Default UserIdentity properties.
 */

var properties = {
  provider: {type: String}, // facebook, google, twitter, linkedin
  authScheme: {type: String}, // oAuth, oAuth 2.0, OpenID, OpenID Connect
  externalId: {type: String}, // The provider specific id
  profile: {type: Object},
  /*
   * oAuth: token, tokenSecret
   * oAuth 2.0: accessToken, refreshToken
   * OpenID: openId
   * OpenID Connect: accessToken, refreshToken, profile
   */
  credentials: {type: Object},
  // userId: {type: String}, // Allow LoopBack to inject it based on the relation
  created: Date,
  modified: Date
};

var options = {
  acls: [
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: ACL.DENY
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.OWNER,
      permission: ACL.ALLOW
    }
  ],
  relations: {
    user: {
      type: 'belongsTo',
      model: 'User',
      foreignKey: 'userId'
    }
  }
};

/**
 * UserIdentity model keeps track of 3rd party logins/profiles
 */
var UserIdentity = DataModel.extend('UserIdentity', properties, options);

var crypto = require('crypto');

function generateKey(hmacKey, algorithm, encoding) {
  hmacKey = hmacKey || 'loopback';
  algorithm = algorithm || 'sha1';
  encoding = encoding || 'hex';
  var hmac = crypto.createHmac(algorithm, hmacKey);
  var buf = crypto.randomBytes(32);
  hmac.update(buf);
  var key = hmac.digest(encoding);
  return key;
}

/**
 * Log in with a third party provider such as facebook or google
 * @param {String} provider The provider name
 * @param {String} authScheme The authentication scheme
 * @param {Object} profile The profile
 * @param {Object} credentials The credentials
 * @callback {Function} cb The callback function
 * @param {Error|String} err The error object or string
 * @param {Object} user The user object
 * @param {Object} [identity] The user identity object
 */
UserIdentity.login = function (provider, authScheme, profile, credentials, cb) {
  var userIdentityModel = (this instanceof UserIdentity) ? this : UserIdentity;
  userIdentityModel.findOne({where: {
    provider: provider,
    externalId: profile.id
  }}, function (err, identity) {
    if (err) {
      return cb(err);
    }
    if (identity) {
      identity.credentials = credentials;
      return identity.updateAttributes({profile: profile,
        credentials: credentials, modified: new Date()}, function (err, i) {
        // Find the user for the given identity
        return identity.user(function (err, user) {
          cb(err, user, identity);
        });
      });
    }
    // Find the user model
    var userModel = (userIdentityModel.relations.user
      && userIdentityModel.relations.user.modelTo)
      || loopback.getModelByType(loopback.User);
    // Let's create a user for that
    var email = profile.emails && profile.emails[0] && profile.emails[0].value;
    userModel.create({
      username: provider + '.' + (profile.username || profile.id),
      password: generateKey('password'),
      email: email
    }, function (err, user) {
      if (err) {
        return cb(err);
      }
      var date = new Date();
      userIdentityModel.create({
        provider: provider,
        externalId: profile.id,
        authScheme: authScheme,
        profile: profile,
        credentials: credentials,
        userId: user.id,
        created: date,
        modified: date
      }, function (err, identity) {
        cb(err, user, identity);
      });
    });
  });
}

/**
 * UserCredential model keeps track of 3rd party credentials for linked accounts
 */
var UserCredential = DataModel.extend('UserCredential', properties, options);

/**
 * Link a third party account to a LoopBack user
 * @param {String} provider The provider name
 * @param {String} authScheme The authentication scheme
 * @param {Object} profile The profile
 * @param {Object} credentials The credentials
 * @callback {Function} cb The callback function
 * @param {Error|String} err The error object or string
 * @param {Object} [credential] The user credential object
 */
UserCredential.link = function (userId, provider, authScheme, profile, credentials, cb) {
  var userCredentialModel = (this instanceof UserCredential) ? this : UserCredential;
  userCredentialModel.findOne({where: {
    userId: userId,
    provider: provider,
    externalId: profile.id
  }}, function (err, extCredential) {
    if (err) {
      return cb(err);
    }

    var date = new Date();
    if (extCredential) {
      // Find the user for the given extCredential
      extCredential.credentials = credentials;
      return extCredential.updateAttributes({profile: profile,
        credentials: credentials, modified: date}, cb);
    }

    // Create the linked account
    userCredentialModel.create({
      provider: provider,
      externalId: profile.id,
      authScheme: authScheme,
      profile: profile,
      credentials: credentials,
      userId: userId,
      created: date,
      modified: date
    }, function (err, i) {
      cb(err, i);
    });

  });
}

module.exports = {
  UserIdentity: UserIdentity,
  UserCredential: UserCredential
};
