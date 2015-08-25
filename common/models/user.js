/*!
 * Module Dependencies.
 */

var debug = require('debug')('loopback:user:*');

/**
 * Built-in User model.
 * Extends LoopBack [PersistedModel](#persistedmodel-new-persistedmodel).
 *
 * Default `User` ACLs.
 *
 * - DENY EVERYONE `*`
 * - ALLOW EVERYONE `create`
 * - ALLOW OWNER `deleteById`
 * - ALLOW EVERYONE `login`
 * - ALLOW EVERYONE `logout`
 * - ALLOW EVERYONE `findById`
 * - ALLOW OWNER `updateAttributes`
 *
 * @property {String} username Must be unique
 * @property {String} password Hidden from remote clients
 * @property {String} email Must be valid email
 * @property {Boolean} emailVerified Set when a user's email has been verified via `confirm()`
 * @property {String} verificationToken Set when `verify()` is called
 * @property {Object} settings Extends the `Model.settings` object.
 * @property {Boolean} settings.emailVerificationRequired Require the email verification
 * process before allowing a login.
 * @property {Number} settings.ttl Default time to live (in seconds) for the `AccessToken` created by `User.login() / user.createAccessToken()`.
 * Default is `1209600` (2 weeks)
 * @property {Number} settings.maxTTL The max value a user can request a token to be alive / valid for.
 * Default is `31556926` (1 year)
 * @property {Boolean} settings.realmRequired Require a realm when logging in a user.
 * @property {String} settings.realmDelimiter When set a realm is required.
 * @property {Number} settings.resetPasswordTokenTTL Time to live for password reset `AccessToken`. Default is `900` (15 minutes).
 * @property {Number} settings.saltWorkFactor The `bcrypt` salt work factor. Default is `10`.
 *
 * @class User
 * @inherits {PersistedModel}
 */

module.exports = function(User) {

  User.prototype.createAccessToken = function() {
    throw new Error('createAccessToken method must be implemented');
  };

};
