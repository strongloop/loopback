var loopback = require('../loopback');

// Role model
var RoleSchema = {
  id: {type: String, id: true}, // Id
  name: {type: String, required: true}, // The name of a role
  description: String, // Description

  // Timestamps
  created: {type: Date, default: Date},
  modified: {type: Date, default: Date}
};

/**
 * Map principals to roles
 */
var RoleMappingSchema = {
  id: {type: String, id: true}, // Id
  roleId: String, // The role id
  principalType: String, // The principal type, such as user, application, or role
  principalId: String // The principal id
};

var RoleMapping = loopback.createModel('RoleMapping', RoleMappingSchema, {
  relations: {
    role: {
      type: 'belongsTo',
      model: 'Role',
      foreignKey: 'roleId'
    }
  }
});

// Principal types
RoleMapping.USER = 'USER';
RoleMapping.APP = RoleMapping.APPLICATION = 'APP';
RoleMapping.ROLE = 'ROLE';

/**
 * Get the application principal
 * @param callback
 */
RoleMapping.prototype.application = function (callback) {
  if (this.principalType === RoleMapping.APPLICATION) {
    loopback.Application.findById(this.principalId, callback);
  } else {
    process.nextTick(function () {
      callback && callback(null, null);
    });
  }
};

/**
 * Get the user principal
 * @param callback
 */
RoleMapping.prototype.user = function (callback) {
  if (this.principalType === RoleMapping.USER) {
    loopback.User.findById(this.principalId, callback);
  } else {
    process.nextTick(function () {
      callback && callback(null, null);
    });
  }
};

/**
 * Get the child role principal
 * @param callback
 */
RoleMapping.prototype.childRole = function (callback) {
  if (this.principalType === RoleMapping.ROLE) {
    loopback.User.findById(this.principalId, callback);
  } else {
    process.nextTick(function () {
      callback && callback(null, null);
    });
  }
};

/**
 * Define the Role model with `hasMany` relation to RoleMapping
 */
var Role = loopback.createModel('Role', RoleSchema, {
  relations: {
    principals: {
      type: 'hasMany',
      model: 'RoleMapping',
      foreignKey: 'roleId'
    }
  }
});

// Set up the connection to users/applications/roles once the model
Role.once('dataSourceAttached', function () {
  Role.prototype.users = function (callback) {
    RoleMapping.find({where: {roleId: this.id, principalType: RoleMapping.USER}}, function (err, mappings) {
      if (err) {
        callback && callback(err);
        return;
      }
      return mappings.map(function (m) {
        return m.principalId;
      });
    });
  };

  Role.prototype.applications = function (callback) {
    RoleMapping.find({where: {roleId: this.id, principalType: RoleMapping.APPLICATION}}, function (err, mappings) {
      if (err) {
        callback && callback(err);
        return;
      }
      return mappings.map(function (m) {
        return m.principalId;
      });
    });
  };

  Role.prototype.roles = function (callback) {
    RoleMapping.find({where: {roleId: this.id, principalType: RoleMapping.ROLE}}, function (err, mappings) {
      if (err) {
        callback && callback(err);
        return;
      }
      return mappings.map(function (m) {
        return m.principalId;
      });
    });
  };

});

// Special roles
Role.OWNER = '$owner'; // owner of the object
Role.RELATED = "$related"; // any User with a relationship to the object
Role.AUTHENTICATED = "$authenticated"; // authenticated user
Role.EVERYONE = "$everyone"; // everyone

/**
 * Add custom handler for roles
 * @param role
 * @param resolver The resolver function decides if a principal is in the role dynamically
 *
 * isInRole(role, context, callback)
 */
Role.registerResolver = function(role, resolver) {
  Role.resolvers[role] = resolver;
};

/**
 * Check if a given principal is in the role
 *
 * @param role
 * @param principalType
 * @param principalId
 * @param callback
 */
Role.isInRole = function (role, principalType, principalId, callback) {
  Role.findOne({where: {name: role}}, function (err, result) {
    if (err) {
      callback && callback(err);
      return;
    }
    if(!result) {
      callback && callback(null, false);
      return;
    }
    RoleMapping.findOne({where: {roleId: result.id, principalType: principalType, principalId: principalId}},
      function (err, result) {
        if (err) {
          callback && callback(err);
          return;
        }
        callback && callback(null, !!result);
      });
  });
};

/**
 * List roles for a given principal
 * @param {String} principalType
 * @param {String|Number} principalId
 * @param {Function} callback
 *
 * @callback callback
 * @param err
 * @param {String[]} An array of role ids
 */
Role.getRoles = function (principalType, principalId, callback) {
  RoleMapping.find({where: {principalType: principalType, principalId: principalId}}, function (err, mappings) {
    if (err) {
      callback && callback(err);
      return;
    }
    var roles = [];
    mappings.forEach(function (m) {
      roles.push(m.roleId);
    });
    callback && callback(null, roles);
  });
};

module.exports = {
  Role: Role,
  RoleMapping: RoleMapping
};

