var loopback = require('../loopback');
var debug = require('debug')('loopback:security:role');
var assert = require('assert');
var async = require('async');

var AccessContext = require('./access-context').AccessContext;

// Role model
var RoleSchema = {
  id: {type: String, id: true}, // Id
  name: {type: String, required: true}, // The name of a role
  description: String, // Description

  // Timestamps
  created: {type: Date, default: Date},
  modified: {type: Date, default: Date}
};

/*!
 * Map principals to roles
 */
var RoleMappingSchema = {
  id: {type: String, id: true}, // Id
  roleId: String, // The role id
  principalType: String, // The principal type, such as user, application, or role
  principalId: String // The principal id
};

/**
 * The `RoleMapping` model extends from the built in `loopback.Model` type.
 *
 * @class
 * @inherits {Model}
 */

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
 * @callback {Function} callback
 * @param {Error} err
 * @param {Application} application
 */
RoleMapping.prototype.application = function (callback) {
  if (this.principalType === RoleMapping.APPLICATION) {
    var applicationModel = this.constructor.Application
      || loopback.getModelByType(loopback.Application);
    applicationModel.findById(this.principalId, callback);
  } else {
    process.nextTick(function () {
      callback && callback(null, null);
    });
  }
};

/**
 * Get the user principal
 * @callback {Function} callback
 * @param {Error} err
 * @param {User} user
 */
RoleMapping.prototype.user = function (callback) {
  if (this.principalType === RoleMapping.USER) {
    var userModel = this.constructor.User
      || loopback.getModelByType(loopback.User);
    userModel.findById(this.principalId, callback);
  } else {
    process.nextTick(function () {
      callback && callback(null, null);
    });
  }
};

/**
 * Get the child role principal
 * @callback {Function} callback
 * @param {Error} err
 * @param {User} childUser
 */
RoleMapping.prototype.childRole = function (callback) {
  if (this.principalType === RoleMapping.ROLE) {
    var roleModel = this.constructor.Role || loopback.getModelByType(Role);
    roleModel.findById(this.principalId, callback);
  } else {
    process.nextTick(function () {
      callback && callback(null, null);
    });
  }
};

/**
 * The Role Model
 * @class
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
  var roleMappingModel = this.RoleMapping || loopback.getModelByType(RoleMapping);
  Role.prototype.users = function (callback) {
    roleMappingModel.find({where: {roleId: this.id,
      principalType: RoleMapping.USER}}, function (err, mappings) {
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
    roleMappingModel.find({where: {roleId: this.id,
      principalType: RoleMapping.APPLICATION}}, function (err, mappings) {
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
    roleMappingModel.find({where: {roleId: this.id,
      principalType: RoleMapping.ROLE}}, function (err, mappings) {
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
Role.UNAUTHENTICATED = "$unauthenticated"; // authenticated user
Role.EVERYONE = "$everyone"; // everyone

/**
 * Add custom handler for roles
 * @param role
 * @param resolver The resolver function decides if a principal is in the role
 * dynamically
 *
 * function(role, context, callback)
 */
Role.registerResolver = function(role, resolver) {
  if(!Role.resolvers) {
    Role.resolvers = {};
  }
  Role.resolvers[role] = resolver;
};

Role.registerResolver(Role.OWNER, function(role, context, callback) {
  if(!context || !context.model || !context.modelId) {
    process.nextTick(function() {
      callback && callback(null, false);
    });
    return;
  }
  var modelClass = context.model;
  var modelId = context.modelId;
  var userId = context.getUserId();
  Role.isOwner(modelClass, modelId, userId, callback);
});

function isUserClass(modelClass) {
  return modelClass === loopback.User ||
    modelClass.prototype instanceof loopback.User;
}

/*!
 * Check if two user ids matches
 * @param {*} id1
 * @param {*} id2
 * @returns {boolean}
 */
function matches(id1, id2) {
  if (id1 === undefined || id1 === null || id1 ===''
    || id2 === undefined || id2 === null || id2 === '') {
    return false;
  }
  // The id can be a MongoDB ObjectID
  return id1 === id2 || id1.toString() === id2.toString();
}

/**
 * Check if a given userId is the owner the model instance
 * @param {Function} modelClass The model class
 * @param {*} modelId The model id
 * @param {*) userId The user id
 * @param {Function} callback
 */
Role.isOwner = function isOwner(modelClass, modelId, userId, callback) {
  assert(modelClass, 'Model class is required');
  debug('isOwner(): %s %s userId: %s', modelClass && modelClass.modelName, modelId, userId);
  // No userId is present
  if(!userId) {
    process.nextTick(function() {
      callback(null, false);
    });
    return;
  }

  // Is the modelClass User or a subclass of User?
  if(isUserClass(modelClass)) {
    process.nextTick(function() {
      callback(null, matches(modelId, userId));
    });
    return;
  }

  modelClass.findById(modelId, function(err, inst) {
    if(err || !inst) {
      debug('Model not found for id %j', modelId);
      callback && callback(err, false);
      return;
    }
    debug('Model found: %j', inst);
    var ownerId = inst.userId || inst.owner;
    if(ownerId) {
      callback && callback(null, matches(ownerId, userId));
      return;
    } else {
      // Try to follow belongsTo
      for(var r in modelClass.relations) {
        var rel = modelClass.relations[r];
        if(rel.type === 'belongsTo' && isUserClass(rel.modelTo)) {
          debug('Checking relation %s to %s: %j', r, rel.modelTo.modelName, rel);
          inst[r](function(err, user) {
            if(!err && user) {
              debug('User found: %j', user.id);
              callback && callback(null, matches(user.id, userId));
            } else {
              callback && callback(err, false);
            }
          });
          return;
        }
      }
      debug('No matching belongsTo relation found for model %j and user: %j', modelId, userId);
      callback && callback(null, false);
    }
  });
};

Role.registerResolver(Role.AUTHENTICATED, function(role, context, callback) {
  if(!context) {
    process.nextTick(function() {
      callback && callback(null, false);
    });
    return;
  }
  Role.isAuthenticated(context, callback);
});

/**
 * Check if the user id is authenticated
 * @param {Object} context The security context
 * @callback {Function} callback
 * @param {Error} err
 * @param {Boolean} isAuthenticated
 */
Role.isAuthenticated = function isAuthenticated(context, callback) {
  process.nextTick(function() {
    callback && callback(null, context.isAuthenticated());
  });
};

Role.registerResolver(Role.UNAUTHENTICATED, function(role, context, callback) {
  process.nextTick(function() {
    callback && callback(null, !context || !context.isAuthenticated());
  });
});

Role.registerResolver(Role.EVERYONE, function (role, context, callback) {
  process.nextTick(function () {
    callback && callback(null, true); // Always true
  });
});

/**
 * Check if a given principal is in the role
 *
 * @param {String} role The role name
 * @param {Object} context The context object
 * @callback {Function} callback
 * @param {Error} err
 * @param {Boolean} isInRole
 */
Role.isInRole = function (role, context, callback) {
  if (!(context instanceof AccessContext)) {
    context = new AccessContext(context);
  }

  debug('isInRole(): %s', role);
  context.debug();

  var resolver = Role.resolvers[role];
  if (resolver) {
    debug('Custom resolver found for role %s', role);
    resolver(role, context, callback);
    return;
  }

  if (context.principals.length === 0) {
    debug('isInRole() returns: false');
    process.nextTick(function () {
      callback && callback(null, false);
    });
    return;
  }

  var inRole = context.principals.some(function (p) {

    var principalType = p.type || undefined;
    var principalId = p.id || undefined;

    // Check if it's the same role
    return principalType === RoleMapping.ROLE && principalId === role;
  });

  if (inRole) {
    debug('isInRole() returns: %j', inRole);
    process.nextTick(function () {
      callback && callback(null, true);
    });
    return;
  }

  var roleMappingModel = this.RoleMapping || loopback.getModelByType(RoleMapping);
  this.findOne({where: {name: role}}, function (err, result) {
    if (err) {
      callback && callback(err);
      return;
    }
    if (!result) {
      callback && callback(null, false);
      return;
    }
    debug('Role found: %j', result);

    // Iterate through the list of principals
    async.some(context.principals, function (p, done) {
      var principalType = p.type || undefined;
      var principalId = p.id || undefined;
      var roleId = result.id.toString();
      
      if(principalId !== null && principalId !== undefined && (typeof principalId !== 'string') ) {
        principalId = principalId.toString();
      }

      if (principalType && principalId) {
        roleMappingModel.findOne({where: {roleId: roleId,
            principalType: principalType, principalId: principalId}},
          function (err, result) {
            debug('Role mapping found: %j', result);
            done(!err && result); // The only arg is the result
          });
      } else {
        process.nextTick(function () {
          done(false);
        });
      }
    }, function (inRole) {
      debug('isInRole() returns: %j', inRole);
      callback && callback(null, inRole);
    });
  });

};

/**
 * List roles for a given principal
 * @param {Object} context The security context
 * @param {Function} callback
 *
 * @callback {Function} callback
 * @param err
 * @param {String[]} An array of role ids
 */
Role.getRoles = function (context, callback) {
  if(!(context instanceof AccessContext)) {
    context = new AccessContext(context);
  }
  var roles = [];

  var addRole = function (role) {
    if (role && roles.indexOf(role) === -1) {
      roles.push(role);
    }
  };

  var self = this;
  // Check against the smart roles
  var inRoleTasks = [];
  Object.keys(Role.resolvers).forEach(function (role) {
    inRoleTasks.push(function (done) {
      self.isInRole(role, context, function (err, inRole) {
        if(debug.enabled) {
          debug('In role %j: %j', role, inRole);
        }
        if (!err && inRole) {
          addRole(role);
          done();
        } else {
          done(err, null);
        }
      });
    });
  });

  var roleMappingModel = this.RoleMapping || loopback.getModelByType(RoleMapping);
  context.principals.forEach(function (p) {
    // Check against the role mappings
    var principalType = p.type || undefined;
    var principalId = p.id || undefined;

    // Add the role itself
    if (principalType === RoleMapping.ROLE && principalId) {
      addRole(principalId);
    }

    if (principalType && principalId) {
      // Please find() treat undefined matches all values
      inRoleTasks.push(function (done) {
        roleMappingModel.find({where: {principalType: principalType,
          principalId: principalId}}, function (err, mappings) {
          debug('Role mappings found: %s %j', err, mappings);
          if (err) {
            done && done(err);
            return;
          }
          mappings.forEach(function (m) {
            addRole(m.roleId);
          });
          done && done();
        });
      });
    }
  });

  async.parallel(inRoleTasks, function (err, results) {
    debug('getRoles() returns: %j %j', err, roles);
    callback && callback(err, roles);
  });
};

module.exports = {
  Role: Role,
  RoleMapping: RoleMapping
};



