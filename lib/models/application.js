// Application model
var ApplicationSchema = {

    // Basic information
    id: {type: String, required: true},
    name: {type: String, required: true},
    description: String, // description
    icon: String, // The icon url
    public: Boolean,
    permissions: [String],

    userId: String,

    status: String,

    // Keys
    clientKey: String,
    javaScriptKey: String,
    restApiKey: String,
    windowsKey: String,
    masterKey: String,

    // Push notification
    pushPlatforms: [String],
    pushCredentials: [],

    // Authentication
    authenticationEnabled: Boolean,
    anonymousAllowed: Boolean,
    schemes: [String], // Basic, facebook, github, google
    attachedCredentials: [],

   // email
    email: String, // e-mail address
    emailVerified: Boolean, // Is the e-mail verified

    collaborators: [String], // A list of users ids who have permissions to work on this app

    created: Date,
    lastUpdated: Date
};
