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
// blog posts
allow: ['owner', 'admin'] to: '*' // allow owner's of posts and admins to do anything
allow: '*' to: ['find', 'read'] // allow everyone to read and find
// comments
allow '*' to: ['find', 'read'] // read aka findById
allow 'user' to: ['create']
allow ['owner', 'admin'] to: '*'

// users only section
allow: '*' to: ['find', 'read', 'create']
allow: 'owner' to: ['*.destroy', '*.save']

// scopes

// URL level permissions
*/
