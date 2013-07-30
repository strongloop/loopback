// See Device registration
var InstallationSchema = {
    id: {
        type: String,
        required: true,
        id: 1
    },
    appId: String, // Application id
    appVersion: String, // Application version
    userId: String, // User id
    deviceToken: String, // Device token
    deviceType: String, // Device type, such as apns
    subscriptions: [String],

    status: {type: String, default: 'active'}, // Status of the application, production/sandbox/disabled

    // Timestamps
    created: {type: Date, default: Date},
    modified: {type: Date, default: Date}
};

module.exports = function(dataSource) {
    dataSource = dataSource || new require('loopback-datasource-juggler').ModelBuilder();
    var Installation = dataSource.define('Installation', InstallationSchema);
    return Installation;
}
