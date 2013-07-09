/**
 * User Model
 Active User
 Explicit vs. Implicit
 Signup
 Removing the User from the System
 Login
 Logout
 User Management
 Email Verification
 Password Reset
 Forgot Username
 Using Social Identities
 Facebook
 Google+
 LinkedIn
 Twitter
 User Discovery
 Username Existence Check
 * @type {{question: *, answer: *}}
 */
var ChallengeSchema = {
    // id: String,
    question: String,
    answer: String
};

var Credential = {
    // id: String,
    provider: String,
    protocol: String,
    attributes: Object
}

// User model
var UserSchema = {
    id: {type: String, required: true},
    realm: {type: String},
    username: {type: String, required: true},
    // password: {type: String, transient: true}, // Transient property
    hash: {type: String}, // Hash code calculated from sha256(realm, username, password, salt, macKey)
    salt: {type: String},
    macKey: {type: String}, // HMAC to calculate the hash code
    email: String,
    emailVerified: Boolean,
    credentials: [
        'UserCredential' // User credentials, private or public, such as private/public keys, Kerberos tickets, oAuth tokens, facebook, google, github ids
    ],
    challenges: [
        'Challenge' // Security questions/answers
    ],
    // https://en.wikipedia.org/wiki/Multi-factor_authentication
    /*
    factors: [
        'AuthenticationFactor'
    ],
    */
    status: String,
    created: Date,
    modified: Date
}