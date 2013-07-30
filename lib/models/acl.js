/**
Schema ACL options

Object level permissions, for example, an album owned by a user

Factors to be authorized against:

* model name: Album
* model instance properties: userId of the album, friends, shared
* methods
* app and/or user ids/roles
 ** loggedIn
 ** roles
 ** userId
 ** appId
 ** none
 ** everyone
 ** relations: owner/friend/granted

Class level permissions, for example, Album
 * model name: Album
 * methods

URL/Route level permissions
 * url pattern
 * application id
 * ip addresses
 * http headers

Map to oAuth 2.0 scopes

*/

var ACLSchema = {
    model: String, // The model name
    properties: [String], // A list of property names
    methods: [String], // A list of methods
    roles: [String], // A list of roles
    permission: {type: String, enum: ['Allow', 'Deny']}, // Allow/Deny
    status: String, // Enabled/disabled
    created: Date,
    modified: Date
}

// readAccess, writeAccess --> public, userId, role

module.exports = function(dataSource) {
    dataSource = dataSource || new require('loopback-datasource-juggler').ModelBuilder();
    var ACL = dataSource.define('ACL', ACLSchema);
    return ACL;
}