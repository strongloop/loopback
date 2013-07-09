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
    deviceToken: String,
    deviceType: String,
    subscriptions: [String],

    status: {type: String, default: 'active'}, // Status of the application, production/sandbox/disabled

    // Timestamps
    created: {type: Date, default: Date},
    modified: {type: Date, default: Date}
};

module.exports = function(dataSource) {
    dataSource = dataSource || new require('jugglingdb').ModelBuilder();
    var Installation = dataSource.define('Installation', InstallationSchema);
    return Installation;
}
