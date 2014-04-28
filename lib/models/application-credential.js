var DataModel = require('./data-model');

/*!
 * Default ApplicationCredential properties.
 */

var properties = {
  provider: {type: String, required: true}, // facebook, google, twitter, linkedIn
  authScheme: {type: String}, // oAuth, oAuth 2.0, OpenID, OpenID Connect
  /*
   * oAuth: token, tokenSecret
   * oAuth 2.0: accessToken, refreshToken
   * OpenID: openId
   * OpenID Connect: accessToken, refreshToken, profile
   */
  credentials: Object,
  /*
   openId: {
   returnURL: String,
   realm: String
   },
   oAuth2: {
   clientID: String,
   clientSecret: String,
   callbackURL: String
   },
   oAuth: {
   consumerKey: String,
   consumerSecret: String,
   callbackURL: String
   },
   */
  created: Date,
  modified: Date
};

var options = {
  relations: {
    application: {
      type: 'belongsTo',
      model: 'Application',
      foreignKey: 'appId'
    }
  }
};

/**
 * Credentials associated with the LoopBack client application, such as oAuth 2.0
 * client id/secret, or SSL keys
 */
var ApplicationCredential = DataModel.extend('ApplicationCredential', properties, options);
module.exports = ApplicationCredential;

ApplicationCredential.link = function (appId, provider, authScheme, credentials, cb) {
  var appCredentialModel = (this instanceof ApplicationCredential) ? this : ApplicationCredential;
  appCredentialModel.findOne({where: {
    appId: appId,
    provider: provider
  }}, function (err, extCredential) {
    if (err) {
      return cb(err);
    }

    var date = new Date();
    if (extCredential) {
      // Find the app for the given extCredential
      extCredential.credentials = credentials;
      return extCredential.updateAttributes({
        credentials: credentials, modified: date}, cb);
    }

    // Create the linked account
    appCredentialModel.create({
      provider: provider,
      authScheme: authScheme,
      credentials: credentials,
      appId: appId,
      created: date,
      modified: date
    }, function (err, i) {
      cb(err, i);
    });

  });
}
