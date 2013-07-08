/**
 * Data model for Application
 */
var ApplicationSchema = {

    // Basic information
    id: {type: String, required: true},
    name: {type: String, required: true},
    description: String, // description
    icon: String, // The icon image url

    public: Boolean, // Do we list the application in the public catalog?
    permissions: [String],

    owner: String, // The user id of the developer who registers the application
    collaborators: [String], // A list of users ids who have permissions to work on this app

    // EMail
    email: String, // e-mail address
    emailVerified: Boolean, // Is the e-mail verified


    status: String, // Status of the application, enabled/disabled

    // Keys
    clientKey: String,
    javaScriptKey: String,
    restApiKey: String,
    windowsKey: String,
    masterKey: String,

    // Push notification
    pushPlatforms: [String],
    pushCredentials: [],

    // User Authentication
    authenticationEnabled: Boolean,
    anonymousAllowed: Boolean,
    schemes: [String], // Basic, facebook, github, google
    attachedCredentials: [],


    created: Date,
    lastUpdated: Date
};


/**
 * Application management functions
 */

// Register a new application




