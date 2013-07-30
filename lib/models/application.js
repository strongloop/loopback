var assert = require('assert');

// Authentication schemes
var AuthenticationSchemeSchema = {
    scheme: String, // local, facebook, google, twitter, linkedin, github
    credential: Object // Scheme-specific credentials
}

var APNSSettingSchema = {
    pushOptions: {type: {
        gateway: String,
        cert: String,
        key: String
    }},

    feedbackOptions: {type: {
        gateway: String,
        cert: String,
        key: String,
        batchFeedback: Boolean,
        interval: Number
    }}
};

// Push notification settings
var PushNotificationSettingSchema = {
    platform: {type: String, required: true}, // apns, gcm, mpns
    // configuration: {type: Object} // platform-specific configurations
    apns: APNSSettingSchema
}

/**
 * Data model for Application
 */
var ApplicationSchema = {

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
    pushSettings: [PushNotificationSettingSchema],

    // User Authentication
    authenticationEnabled: {type: Boolean, default: true},
    anonymousAllowed: {type: Boolean, default: true},
    authenticationSchemes: [AuthenticationSchemeSchema],

    status: {type: String, default: 'sandbox'}, // Status of the application, production/sandbox/disabled

    // Timestamps
    created: {type: Date, default: Date},
    modified: {type: Date, default: Date}
};


/**
 * Application management functions
 */

var crypto = require('crypto');

function generateKey(hmacKey, algorithm, encoding) {
    hmacKey = hmacKey || 'loopback';
    algorithm = algorithm || 'sha256';
    encoding = encoding || 'base64';
    var hmac = crypto.createHmac(algorithm, hmacKey);
    var buf = crypto.randomBytes(64);
    hmac.update(buf);
    return hmac.digest('base64');
}

module.exports = function (dataSource) {
    dataSource = dataSource || new require('loopback-datasource-juggler').ModelBuilder();

    // var AuthenticationScheme = dataSource.define('AuthenticationScheme', AuthenticationSchemeSchema);
    // ApplicationSchema.authenticationSchemes = [AuthenticationScheme];

    // var PushNotificationSetting = dataSource.define('PushNotificationSetting', PushNotificationSettingSchema);
    // ApplicationSchema.pushSettings = [PushNotificationSetting];

    var Application = dataSource.define('Application', ApplicationSchema);

    // Application.hasMany(AuthenticationScheme, {as: 'authenticationSchemes',  foreignKey: 'appId'});
    // Application.hasMany(PushNotificationSetting, {as: 'pushNotificationSettings',  foreignKey: 'appId'});

    Application.beforeCreate = function (next) {
        // console.trace();
        var app = this;
        // use data argument to update object
        app.created = app.modified = new Date();
        app.id = generateKey('id', 'sha1');
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

        if(typeof options === 'function' && !cb) {
            cb = options;
            options = {};
        }
        var props = {owner: owner, name: name};
        for(var p in options) {
            if(!(p in props)) {
                props[p] = options[p];
            }
        }
        Application.create(props, cb);
    }

    /**
     * Reset keys for the application instance
     * @param cb
     */
    Application.prototype.resetKeys = function(cb) {
        this.clientKey = generateKey('client');
        this.javaScriptKey = generateKey('javaScript');
        this.restApiKey = generateKey('restApi');
        this.windowsKey = generateKey('windows');
        this.masterKey = generateKey('master');
        this.modified = new Date();
        this.save(cb);
    }

    /**
     * Reset keys for a given application by the appId
     * @param appId
     * @param cb
     */
    Application.resetKeys = function(appId, cb) {
        Application.findById(appId, function(err, app) {
           if(err) {
               cb && cb(err, app);
               return;
           }
           app.resetKeys(cb);
        });
    }

    /**
     *
     * @param appId
     * @param key
     * @param cb
     */
    Application.authenticate = function(appId, key, cb) {
       Application.findById(appId, function(err, app) {
          if(err || !app) {
              cb && cb(err, null);
              return;
          }
          var matched = null;
          ['clientKey', 'javaScriptKey', 'restApiKey', 'windowsKey', 'masterKey'].forEach(function(k) {
            if(app[k] === key) {
                matched = k;
            }
          });
          cb && cb(null, matched);
       });
    }

    return Application;
}





