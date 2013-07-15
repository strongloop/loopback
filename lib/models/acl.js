// Schema ACL options


// Object level permissions

// open: no protection
// none: always rejected
// owner: only the owner
// loggedIn: any logged in user
// roles: logged in users with the roles
// related: owner of the related objects

// Class level permissions

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


