var loopback = require('../loopback');

// Role model
var RoleSchema = {
  id: {type: String, id: true}, // Id
  name: {type: String, required: true}, // The name of a role
  description: String, // Description
  // roles: [String], // A role can be an aggregate of other roles
  // users: [String], // A role contains a list of user ids

  parent: String,
  // Timestamps
  created: {type: Date, default: Date},
  modified: {type: Date, default: Date}
};

var Role = loopback.createModel('Role', RoleSchema, {
  relations: {
    roles: {
      type: 'hasMany',
      model: 'Role',
      foreignKey: 'parent'
    },
    users: {
      type: 'hasAndBelongsToMany',
      model: 'user',
      foreignKey: 'userId'
    },
    applications: {
      type: 'hasAndBelongsToMany',
      model: 'Application',
      foreignKey: 'appId'
    }
  }
});

module.exports = Role;

// Special roles
Role.OWNER = '$owner'; // owner of the object
Role.RELATED = "$related"; // any User with a relationship to the object
Role.AUTHENTICATED = "$authenticated"; // authenticated user
Role.EVERYONE = "$everyone"; // everyone

