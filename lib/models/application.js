var loopback = require('../loopback');
var assert = require('assert');

// Authentication schemes
var AuthenticationSchemeSchema = {
  scheme: String, // local, facebook, google, twitter, linkedin, github
  credential: Object // Scheme-specific credentials
};

// See https://github.com/argon/node-apn/blob/master/doc/apn.markdown
var APNSSettingSchema = {
  /**
   * production or development mode. It denotes what default APNS servers to be
   * used to send notifications
   * - true (production mode)
   *   - push: gateway.push.apple.com:2195
   *   - feedback: feedback.push.apple.com:2196
   * - false (development mode, the default)
   *   - push: gateway.sandbox.push.apple.com:2195
   *   - feedback: feedback.sandbox.push.apple.com:2196
   */
  production: Boolean,
  certData: String, // The certificate data loaded from the cert.pem file
  keyData: String, // The key data loaded from the key.pem file

  pushOptions: {type: {
    gateway: String,
    port: Number
  }},

  feedbackOptions: {type: {
    gateway: String,
    port: Number,
    batchFeedback: Boolean,
    interval: Number
  }}
};

var GcmSettingsSchema = {
  serverApiKey: String
};

// Push notification settings
var PushNotificationSettingSchema = {
  apns: APNSSettingSchema,
  gcm: GcmSettingsSchema
};

/*!
 * Data model for Application
 */
var ApplicationSchema = {
  id: {type: String, id: true},
  // Basic information
  name: {type: String, required: true}, // The name
  description: String, // The description
  icon: String, // The icon image url

  owner: String, // The user id of the developer who registers the application
  collaborators: [String], // A list of users ids who have permissions to work on this app

  // EMail
  email: String, // e-mail address
  emailVerified: Boolean, // Is the e-mail verified

  // oAuth 2.0 settings
  url: String, // The application url
  callbackUrls: [String], // oAuth 2.0 code/token callback url
  permissions: [String], // A list of permissions required by the application

  // Keys
  clientKey: String,
  javaScriptKey: String,
  restApiKey: String,
  windowsKey: String,
  masterKey: String,

  // Push notification
  pushSettings: PushNotificationSettingSchema,

  // User Authentication
  authenticationEnabled: {type: Boolean, default: true},
  anonymousAllowed: {type: Boolean, default: true},
  authenticationSchemes: [AuthenticationSchemeSchema],

  status: {type: String, default: 'sandbox'}, // Status of the application, production/sandbox/disabled

  // Timestamps
  created: {type: Date, default: Date},
  modified: {type: Date, default: Date}
};

/*!
 * Application management functions
 */

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
 * Manage client applications and organize their users.
 * 
 * @property {String} id  Generated ID.
 * @property {String} name Name; required.
 * @property {String} description Text description
 * @property {String} icon String Icon image URL.
 * @property {String} owner User ID of the developer who registers the application.
 * @property {String} email E-mail address
 * @property {Boolean} emailVerified Whether the e-mail is verified.
 * @property {String} url OAuth 2.0  application URL.
 * @property {String}[] callbackUrls The OAuth 2.0 code/token callback URL.
 * @property {String} status Status of the application; Either `production`, `sandbox` (default), or `disabled`.
 * @property {Date} created Date Application object was created.  Default: current date.
 * @property {Date} modified Date Application object was modified.  Default: current date.
 * 
 * @property {Boolean} pushSettings.apns.production Whether to use production Apple Push Notification Service (APNS) servers to send push notifications.
 * If true, uses `gateway.push.apple.com:2195` and `feedback.push.apple.com:2196`.
 * If false, uses `gateway.sandbox.push.apple.com:2195` and `feedback.sandbox.push.apple.com:2196`
 * @property {String} pushSettings.apns.certData The certificate data loaded from the cert.pem file (APNS).
 * @property {String} pushSettings.apns.keyData The key data loaded from the key.pem file (APNS).
 * @property {String} pushSettings.apns.pushOptions.gateway (APNS).
 * @property {Number} pushSettings.apns.pushOptions.port (APNS).
 * @property {String} pushSettings.apns.feedbackOptions.gateway  (APNS).
 * @property {Number} pushSettings.apns.feedbackOptions.port (APNS).
 * @property {Boolean} pushSettings.apns.feedbackOptions.batchFeedback (APNS).
 * @property {Number} pushSettings.apns.feedbackOptions.interval (APNS).
 * @property {String} pushSettings.gcm.serverApiKey: Google Cloud Messaging API key.
 * 
 * @class
 * @inherits {Model}
 */

var Application = loopback.PersistedModel.extend('Application', ApplicationSchema);

/*!
 * A hook to generate keys before creation
 * @param next
 */
Application.beforeCreate = function (next) {
  var app = this;
  app.created = app.modified = new Date();
  app.id = generateKey('id', 'md5');
  app.clientKey = generateKey('client');
  app.javaScriptKey = generateKey('javaScript');
  app.restApiKey = generateKey('restApi');
  app.windowsKey = generateKey('windows');
  app.masterKey = generateKey('master');
  next();
};

/**
 * Register a new application
 * @param {String} owner Owner's user ID.
 * @param {String} name  Name of the application
 * @param {Object} options  Other options
 * @param {Function} callback  Callback function
 */
Application.register = function (owner, name, options, cb) {
  assert(owner, 'owner is required');
  assert(name, 'name is required');

  if (typeof options === 'function' && !cb) {
    cb = options;
    options = {};
  }
  var props = {owner: owner, name: name};
  for (var p in options) {
    if (!(p in props)) {
      props[p] = options[p];
    }
  }
  this.create(props, cb);
};

/**
 * Reset keys for the application instance
 * @callback {Function} callback
 * @param {Error} err
 */
Application.prototype.resetKeys = function (cb) {
  this.clientKey = generateKey('client');
  this.javaScriptKey = generateKey('javaScript');
  this.restApiKey = generateKey('restApi');
  this.windowsKey = generateKey('windows');
  this.masterKey = generateKey('master');
  this.modified = new Date();
  this.save(cb);
};

/**
 * Reset keys for a given application by the appId
 * @param {Any} appId
 * @callback {Function} callback
 * @param {Error} err
 */
Application.resetKeys = function (appId, cb) {
  this.findById(appId, function (err, app) {
    if (err) {
      cb && cb(err, app);
      return;
    }
    app.resetKeys(cb);
  });
};

/**
 * Authenticate the application id and key.
 *
 * @param {Any} appId
 * @param {String} key
 * @callback {Function} callback
 * @param {Error} err
 * @param {String} matched The matching key; One of:
 * 
 * - clientKey
 * - javaScriptKey
 * - restApiKey
 * - windowsKey 
 * - masterKey
 */
Application.authenticate = function (appId, key, cb) {
  this.findById(appId, function (err, app) {
    if (err || !app) {
      cb && cb(err, null);
      return;
    }
    var result = null;
    var keyNames = ['clientKey', 'javaScriptKey', 'restApiKey', 'windowsKey', 'masterKey'];
    for (var i = 0; i < keyNames.length; i++) {
      if (app[keyNames[i]] === key) {
        result = {
          application: app,
          keyType: keyNames[i]
        };
        break;
      }
    }
    cb && cb(null, result);
  });
};

module.exports = Application;

