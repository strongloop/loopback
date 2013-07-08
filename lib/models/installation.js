// See Device registration
var InstallationSchema = {
    id: {
        type: String,
        required: true,
        id: 1
    },
    appId: String,
    appVersion: String,
    userId: String,
    deviceToken: String,
    deviceType: String,
    subscriptions: [String],
    created: Date,
    lastModified: Date,
    status: String
};
