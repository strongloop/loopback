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

/**
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
 * @class
 * @inherits {Model}
 */

var Application = loopback.createModel('Application', ApplicationSchema);

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
 * @param owner Owner's user id
 * @param name Name of the application
 * @param options Other options
 * @param cb Callback function
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
 * `matched` parameter is one of:
 * - clientKey
 * - javaScriptKey
 * - restApiKey
 * - windowsKey 
 * - masterKey
 *
 * @param {Any} appId
 * @param {String} key
 * @callback {Function} callback
 * @param {Error} err
 * @param {String} matched The matching key
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

