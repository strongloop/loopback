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
    id: {type: String, required: true}, // The id
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

function generateKey(hmacKey, algorithm) {
    hmacKey = hmacKey || 'loopback';
    algorithm = algorithm || 'sha256';
    var hmac = crypto.createHmac(algorithm, hmacKey);
    var buf = crypto.randomBytes(64);
    hmac.update(buf);
    return hmac.digest('base64');
}

module.exports = function (dataSource) {
    dataSource = dataSource || new require('jugglingdb').ModelBuilder();

    // var AuthenticationScheme = dataSource.define('AuthenticationScheme', AuthenticationSchemeSchema);
    // ApplicationSchema.authenticationSchemes = [AuthenticationScheme];

    // var PushNotificationSetting = dataSource.define('PushNotificationSetting', PushNotificationSettingSchema);
    // ApplicationSchema.pushSettings = [PushNotificationSetting];

    var Application = dataSource.define('Application', ApplicationSchema);

    // Application.hasMany(AuthenticationScheme, {as: 'authenticationSchemes',  foreignKey: 'appId'});
    // Application.hasMany(PushNotificationSetting, {as: 'pushNotificationSettings',  foreignKey: 'appId'});

    Application.afterInitialize = function () {
        var app = this;
        // use data argument to update object
        app.created = app.modified = new Date();
        app.id = generateKey('id', 'sha1');
        app.clientKey = generateKey('client');
        app.javaScriptKey = generateKey('javaScript');
        app.restApiKey = generateKey('restApi');
        app.windowsKey = generateKey('windows');
        app.masterKey = generateKey('master');
    };

    // Register a new application
    Application.register = function (name, description, owner, cb) {
        Application.create({name: name, description: description, owner: owner}, cb);
    }

    Application.prototype.resetKeys = function(cb) {
        this.clientKey = generateKey('client');
        this.javaScriptKey = generateKey('javaScript');
        this.restApiKey = generateKey('restApi');
        this.windowsKey = generateKey('windows');
        this.masterKey = generateKey('master');
        this.save(cb);
    }

    return Application;
}





