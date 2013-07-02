/**
 * Module Dependencies.
 */

var Model = require('../asteroid').Model;

/**
 * Default User properties.
 */

var properties = {
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
    lastUpdated: Date
}


/**
 * Extends from the built in `asteroid.Model` type.
 */

var User = module.exports = Model.extend('user', properties);

