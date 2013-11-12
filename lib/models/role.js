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

RoleMapping.prototype.application = function(callback) {
  if(this.principalType === 'application') {
    loopback.Application.findById(this.principalId, callback);
  } else {
    process.nextTick(function() {
      callback && callback(null, null);
    });
  }
};

RoleMapping.prototype.user = function(callback) {
  if(this.principalType === 'user') {
    loopback.User.findById(this.principalId, callback);
  } else {
    process.nextTick(function() {
      callback && callback(null, null);
    });
  }
};

RoleMapping.prototype.childRole = function(callback) {
  if(this.principalType === 'role') {
    loopback.User.findById(this.principalId, callback);
  } else {
    process.nextTick(function() {
      callback && callback(null, null);
    });
  }
};

var Role = loopback.createModel('Role', RoleSchema, {
  relations: {
    principals: {
      type: 'hasMany',
      model: 'RoleMapping',
      foreignKey: 'roleId'
    }
  }
});


Role.once('dataSourceAttached', function() {
  Role.prototype.users = function(callback) {
    RoleMapping.find({where: {roleId: this.id, principalType: 'user'}}, function(err, mappings) {
      if(err) {
        callback && callback(err);
        return;
      }
      return mappings.map(function(m) {
        return m.principalId;
      });
    });
  };

  Role.prototype.applications = function(callback) {
    RoleMapping.find({where: {roleId: this.id, principalType: 'application'}}, function(err, mappings) {
      if(err) {
        callback && callback(err);
        return;
      }
      return mappings.map(function(m) {
        return m.principalId;
      });
    });
  };

  Role.prototype.roles = function(callback) {
    RoleMapping.find({where: {roleId: this.id, principalType: 'role'}}, function(err, mappings) {
      if(err) {
        callback && callback(err);
        return;
      }
      return mappings.map(function(m) {
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
 * Check if a given principal is in the role
 *
 * @param principalType
 * @param principalId
 * @param role
 * @param callback
 */
Role.isInRole = function(principalType, principalId, role, callback) {
  Role.findOne({where: {name: role}}, function(err, role) {
    if(err) {
      callback && callback(err);
      return;
    }
    RoleMapping.exists({where: {roleId: role.id, principalType: principalType, principalId: principalId}}, callback);
  });
};

/**
 * List roles for a given principal
 * @param principalType
 * @param principalId
 * @param role
 * @param callback
 */
Role.getRoles = function(principalType, principalId, role, callback) {
  RoleMapping.find({where: {principalType: principalType, principalId: principalId}},function(err, mappings) {
    if(err) {
      callback && callback(err);
      return;
    }
    var roles = [];
    mappings.forEach(function(m) {
      roles.push(m.roleId);
    });
    callback && callback(null, roles);
  });
};

module.exports = {
  Role: Role,
  RoleMapping: RoleMapping
};

