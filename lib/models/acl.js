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