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

var loopback = require('loopback');

var ACLEntrySchema = {
    /**
     * Type of the principal - Application/User/Role
     */
    principalType: String,
    /**
     * Id of the principal - such as appId, userId or roleId
     */
    principalId: String,

    /**
     * Name of the access type - READ/WRITE/EXEC
     */
    accessType: String,

    /**
     * ALARM - Generate an alarm, in a system dependent way, the access specified in the permissions component of the ACL entry.
     * ALLOW - Explicitly grants access to the resource.
     * AUDIT - Log, in a system dependent way, the access specified in the permissions component of the ACL entry.
     * DENY - Explicitly denies access to the resource.
     */
    permission: String
};

var AccessSchema = {
    publicReadAccess: Boolean,
    publicWriteAccess: Boolean,
    publicExecAccess: Boolean,
    permissions: [ACLEntrySchema]
};

var ACLSchema = {
    /**
     * Resource
     */
    model: String, // The name of the model
    property: String, // The name of the property
    method: String, // The name of the method

    access: AccessSchema, // The access

    status: String,
    created: Date,
    modified: Date
};


var ACL = loopback.createModel('ACL', ACLSchema);

module.exports = ACL;