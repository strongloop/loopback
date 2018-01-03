// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var loopback = require('../../lib/loopback');
var debug = require('debug')('loopback:security:role');
var assert = require('assert');
var async = require('async');
var utils = require('../../lib/utils');
var ctx = require('../../lib/access-context');
var AccessContext = ctx.AccessContext;
var Principal = ctx.Principal;
var RoleMapping = loopback.RoleMapping;

assert(RoleMapping, 'RoleMapping model must be defined before Role model');

/**
 * The Role model
 * @class Role
 * @header Role object
 */
module.exports = function(Role) {
  Role.resolveRelatedModels = function() {
    if (!this.userModel) {
      var reg = this.registry;
      this.roleMappingModel = reg.getModelByType('RoleMapping');
      this.userModel = reg.getModelByType('User');
      this.applicationModel = reg.getModelByType('Application');
    }
  };

  // Set up the connection to users/applications/roles once the model
  Role.once('dataSourceAttached', function(roleModel) {
    ['users', 'applications', 'roles'].forEach(function(rel) {
      /**
       * Fetch all users assigned to this role
       * @function Role.prototype#users
       * @param {object} [query] query object passed to model find call
       * @callback {Function} [callback] The callback function
       * @param {String|Error} err The error string or object
       * @param {Array} list The list of users.
       * @promise
       */
      /**
       * Fetch all applications assigned to this role
       * @function Role.prototype#applications
       * @param {object} [query] query object passed to model find call
       * @callback {Function} [callback] The callback function
       * @param {String|Error} err The error string or object
       * @param {Array} list The list of applications.
       * @promise
       */
      /**
       * Fetch all roles assigned to this role
       * @function Role.prototype#roles
       * @param {object} [query] query object passed to model find call
       * @callback {Function} [callback] The callback function
       * @param {String|Error} err The error string or object
       * @param {Array} list The list of roles.
       * @promise
       */
      Role.prototype[rel] = function(query, callback) {
        if (!callback) {
          if (typeof query === 'function') {
            callback = query;
            query = {};
          } else {
            callback = utils.createPromiseCallback();
          }
        }
        query = query || {};
        query.where = query.where || {};

        roleModel.resolveRelatedModels();
        var relsToModels = {
          users: roleModel.userModel,
          applications: roleModel.applicationModel,
          roles: roleModel,
        };

        var ACL = loopback.ACL;
        var relsToTypes = {
          users: ACL.USER,
          applications: ACL.APP,
          roles: ACL.ROLE,
        };

        var principalModel = relsToModels[rel];
        var principalType = relsToTypes[rel];

        // redefine user model and user type if user principalType is custom (available and not "USER")
        var isCustomUserPrincipalType = rel === 'users' &&
          query.where.principalType &&
          query.where.principalType !== RoleMapping.USER;

        if (isCustomUserPrincipalType) {
          var registry = this.constructor.registry;
          principalModel = registry.findModel(query.where.principalType);
          principalType = query.where.principalType;
        }
        // make sure we don't keep principalType in userModel query
        delete query.where.principalType;

        if (principalModel) {
          listByPrincipalType(this, principalModel, principalType, query, callback);
        } else {
          process.nextTick(function() {
            callback(null, []);
          });
        }
        return callback.promise;
      };
    });

    /**
     * Fetch all models assigned to this role
     * @private
     * @param {object} Context role context
     * @param {*} model model type to fetch
     * @param {String} [principalType] principalType used in the rolemapping for model
     * @param {object} [query] query object passed to model find call
     * @param  {Function} [callback] callback function called with `(err, models)` arguments.
     */
    function listByPrincipalType(context, model, principalType, query, callback) {
      if (callback === undefined && typeof query === 'function') {
        callback = query;
        query = {};
      }
      query = query || {};

      roleModel.roleMappingModel.find({
        where: {roleId: context.id, principalType: principalType},
      }, function(err, mappings) {
        var ids;
        if (err) {
          return callback(err);
        }
        ids = mappings.map(function(m) {
          return m.principalId;
        });
        query.where = query.where || {};
        query.where.id = {inq: ids};
        model.find(query, function(err, models) {
          callback(err, models);
        });
      });
    }
  });

  // Special roles
  Role.OWNER = '$owner'; // owner of the object
  Role.RELATED = '$related'; // any User with a relationship to the object
  Role.AUTHENTICATED = '$authenticated'; // authenticated user
  Role.UNAUTHENTICATED = '$unauthenticated'; // authenticated user
  Role.EVERYONE = '$everyone'; // everyone

  /**
   * Add custom handler for roles.
   * @param {String} role Name of role.
   * @param {Function} resolver Function that determines
   * if a principal is in the specified role.
   * Should provide a callback or return a promise.
   */
  Role.registerResolver = function(role, resolver) {
    if (!Role.resolvers) {
      Role.resolvers = {};
    }
    Role.resolvers[role] = resolver;
  };

  Role.registerResolver(Role.OWNER, function(role, context, callback) {
    if (!context || !context.model || !context.modelId) {
      process.nextTick(function() {
        if (callback) callback(null, false);
      });
      return;
    }
    var modelClass = context.model;
    var modelId = context.modelId;
    var user = context.getUser();
    var userId = user && user.id;
    var principalType = user && user.principalType;
    var opts = {accessToken: context.accessToken};
    Role.isOwner(modelClass, modelId, userId, principalType, opts, callback);
  });

  function isUserClass(modelClass) {
    if (!modelClass) return false;
    var User = modelClass.modelBuilder.models.User;
    if (!User) return false;
    return modelClass == User || modelClass.prototype instanceof User;
  }

  /*!
   * Check if two user IDs matches
   * @param {*} id1
   * @param {*} id2
   * @returns {boolean}
   */
  function matches(id1, id2) {
    if (id1 === undefined || id1 === null || id1 === '' ||
      id2 === undefined || id2 === null || id2 === '') {
      return false;
    }
    // The id can be a MongoDB ObjectID
    return id1 === id2 || id1.toString() === id2.toString();
  }

  /**
   * Check if a given user ID is the owner the model instance.
   * @param {Function} modelClass The model class
   * @param {*} modelId The model ID
   * @param {*} userId The user ID
   * @param {String} principalType The user principalType (optional)
   * @options {Object} options
   * @property {accessToken} The access token used to authorize the current user.
   * @callback {Function} [callback] The callback function
   * @param {String|Error} err The error string or object
   * @param {Boolean} isOwner True if the user is an owner.
   * @promise
   */
  Role.isOwner = function isOwner(modelClass, modelId, userId, principalType, options, callback) {
    var _this = this;

    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    } else if (!callback && typeof principalType === 'function') {
      callback = principalType;
      principalType = undefined;
      options = {};
    }
    principalType = principalType || Principal.USER;

    assert(modelClass, 'Model class is required');
    if (!callback) callback = utils.createPromiseCallback();

    debug('isOwner(): %s %s userId: %s principalType: %s',
      modelClass && modelClass.modelName, modelId, userId, principalType);

    // Resolve isOwner false if userId is missing
    if (!userId) {
      process.nextTick(function() {
        callback(null, false);
      });
      return callback.promise;
    }

    // At this stage, principalType is valid in one of 2 following condition:
    // 1. the app has a single user model and principalType is 'USER'
    // 2. the app has multiple user models and principalType is not 'USER'
    // multiple user models
    var isMultipleUsers = _isMultipleUsers();
    var isPrincipalTypeValid =
      (!isMultipleUsers && principalType === Principal.USER) ||
      (isMultipleUsers && principalType !== Principal.USER);

    // Resolve isOwner false if principalType is invalid
    if (!isPrincipalTypeValid) {
      process.nextTick(function() {
        callback(null, false);
      });
      return callback.promise;
    }

    // Is the modelClass User or a subclass of User?
    if (isUserClass(modelClass)) {
      var userModelName = modelClass.modelName;
      // matching ids is enough if principalType is USER or matches given user model name
      if (principalType === Principal.USER || principalType === userModelName) {
        process.nextTick(function() {
          callback(null, matches(modelId, userId));
        });
      }
      return callback.promise;
    }

    modelClass.findById(modelId, options, function(err, inst) {
      if (err || !inst) {
        debug('Model not found for id %j', modelId);
        return callback(err, false);
      }
      debug('Model found: %j', inst);

      var ownerRelations = modelClass.settings.ownerRelations;
      if (!ownerRelations) {
        return legacyOwnershipCheck(inst);
      } else {
        return checkOwnership(inst);
      }
    });
    return callback.promise;

    // NOTE Historically, for principalType USER, we were resolving isOwner()
    // as true if the model has "userId" or "owner" property matching
    // id of the current user (principalId), even though there was no
    // belongsTo relation set up.
    // Additionaly, the original implementation did not support the
    // possibility for a model to have multiple related users: when
    // testing belongsTo relations, the first related user failing the
    // ownership check induced the whole isOwner() to resolve as false.
    // This behaviour will be pruned at next LoopBack major release.
    function legacyOwnershipCheck(inst) {
      var ownerId = inst.userId || inst.owner;
      if (principalType === Principal.USER && ownerId && 'function' !== typeof ownerId) {
        return callback(null, matches(ownerId, userId));
      }

      // Try to follow belongsTo
      for (var r in modelClass.relations) {
        var rel = modelClass.relations[r];
        // relation should be belongsTo and target a User based class
        var belongsToUser = rel.type === 'belongsTo' && isUserClass(rel.modelTo);
        if (!belongsToUser) {
          continue;
        }

        // checking related user
        var relatedUser = rel.modelTo;
        var userModelName = relatedUser.modelName;
        var isMultipleUsers = _isMultipleUsers(relatedUser);
        // a relation can be considered for isOwner resolution if:
        // 1. the app has a single user model and principalType is 'USER'
        // 2. the app has multiple user models and principalType is the related user model name
        if ((!isMultipleUsers && principalType === Principal.USER) ||
            (isMultipleUsers && principalType === userModelName)) {
          debug('Checking relation %s to %s: %j', r, userModelName, rel);
          inst[r](processRelatedUser);
          return;
        }
      }
      debug('No matching belongsTo relation found for model %j - user %j principalType %j',
        modelId, userId, principalType);
      callback(null, false);

      function processRelatedUser(err, user) {
        if (err || !user) return callback(err, false);

        debug('User found: %j', user.id);
        callback(null, matches(user.id, userId));
      }
    }

    function checkOwnership(inst) {
      var ownerRelations = inst.constructor.settings.ownerRelations;
      // collecting related users
      var relWithUsers = [];
      for (var r in modelClass.relations) {
        var rel = modelClass.relations[r];
        // relation should be belongsTo and target a User based class
        if (rel.type !== 'belongsTo' || !isUserClass(rel.modelTo)) {
          continue;
        }

        // checking related user
        var relatedUser = rel.modelTo;
        var userModelName = relatedUser.modelName;
        var isMultipleUsers = _isMultipleUsers(relatedUser);
        // a relation can be considered for isOwner resolution if:
        // 1. the app has a single user model and principalType is 'USER'
        // 2. the app has multiple user models and principalType is the related user model name
        // In addition, if an array of relations if provided with the ownerRelations option,
        // then the given relation name is further checked against this array
        if ((!isMultipleUsers && principalType === Principal.USER) ||
            (isMultipleUsers && principalType === userModelName)) {
          debug('Checking relation %s to %s: %j', r, userModelName, rel);
          if (ownerRelations === true) {
            relWithUsers.push(r);
          } else if (Array.isArray(ownerRelations) && ownerRelations.indexOf(r) !== -1) {
            relWithUsers.push(r);
          }
        }
      }
      if (relWithUsers.length === 0) {
        debug('No matching belongsTo relation found for model %j and user: %j principalType: %j',
          modelId, userId, principalType);
        return callback(null, false);
      }

      // check related users: someSeries is used to avoid spamming the db
      async.someSeries(relWithUsers, processRelation, callback);

      function processRelation(r, cb) {
        inst[r](function processRelatedUser(err, user) {
          if (err || !user) return cb(err, false);

          debug('User found: %j (through %j)', user.id, r);
          cb(null, matches(user.id, userId));
        });
      }
    }

    // A helper function to check if the app user config is multiple users or
    // single user. It can be used with or without a reference user model.
    // In case no user model is provided, we use the registry to get any of the
    // user model by type. The relation with AccessToken is used to check
    // if polymorphism is used, and thus if multiple users.
    function _isMultipleUsers(userModel) {
      var oneOfUserModels = userModel || _this.registry.getModelByType('User');
      var accessTokensRel = oneOfUserModels.relations.accessTokens;
      return !!(accessTokensRel && accessTokensRel.polymorphic);
    }
  };

  Role.registerResolver(Role.AUTHENTICATED, function(role, context, callback) {
    if (!context) {
      process.nextTick(function() {
        if (callback) callback(null, false);
      });
      return;
    }
    Role.isAuthenticated(context, callback);
  });

  /**
   * Check if the user ID is authenticated
   * @param {Object} context The security context.
   *
   * @callback {Function} callback Callback function.
   * @param {Error} err Error object.
   * @param {Boolean} isAuthenticated True if the user is authenticated.
   * @promise
   */
  Role.isAuthenticated = function isAuthenticated(context, callback) {
    if (!callback) callback = utils.createPromiseCallback();
    process.nextTick(function() {
      if (callback) callback(null, context.isAuthenticated());
    });
    return callback.promise;
  };

  Role.registerResolver(Role.UNAUTHENTICATED, function(role, context, callback) {
    process.nextTick(function() {
      if (callback) callback(null, !context || !context.isAuthenticated());
    });
  });

  Role.registerResolver(Role.EVERYONE, function(role, context, callback) {
    process.nextTick(function() {
      if (callback) callback(null, true); // Always true
    });
  });

  /**
   * Check if a given principal is in the specified role.
   *
   * @param {String} role The role name.
   * @param {Object} context The context object.
   *
   * @callback {Function} callback Callback function.
   * @param {Error} err Error object.
   * @param {Boolean} isInRole True if the principal is in the specified role.
   * @promise
   */
  Role.isInRole = function(role, context, callback) {
    context.registry = this.registry;
    if (!(context instanceof AccessContext)) {
      context = new AccessContext(context);
    }

    if (!callback) {
      callback = utils.createPromiseCallback();
      // historically, isInRole is returning the Role instance instead of true
      // we are preserving that behaviour for callback-based invocation,
      // but fixing it when invoked in Promise mode
      callback.promise = callback.promise.then(function(isInRole) {
        return !!isInRole;
      });
    }

    this.resolveRelatedModels();

    debug('isInRole(): %s', role);
    context.debug();

    var resolver = Role.resolvers[role];
    if (resolver) {
      debug('Custom resolver found for role %s', role);

      var promise = resolver(role, context, callback);
      if (promise && typeof promise.then === 'function') {
        promise.then(
          function(result) { callback(null, result); },
          callback
        );
      }
      return callback.promise;
    }

    if (context.principals.length === 0) {
      debug('isInRole() returns: false');
      process.nextTick(function() {
        if (callback) callback(null, false);
      });
      return callback.promise;
    }

    var inRole = context.principals.some(function(p) {
      var principalType = p.type || undefined;
      var principalId = p.id || undefined;

      // Check if it's the same role
      return principalType === RoleMapping.ROLE && principalId === role;
    });

    if (inRole) {
      debug('isInRole() returns: %j', inRole);
      process.nextTick(function() {
        if (callback) callback(null, true);
      });
      return callback.promise;
    }

    var roleMappingModel = this.roleMappingModel;
    this.findOne({where: {name: role}}, function(err, result) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      if (!result) {
        if (callback) callback(null, false);
        return;
      }
      debug('Role found: %j', result);

      // Iterate through the list of principals
      async.some(context.principals, function(p, done) {
        var principalType = p.type || undefined;
        var principalId = p.id || undefined;
        var roleId = result.id.toString();
        var principalIdIsString = typeof principalId === 'string';

        if (principalId !== null && principalId !== undefined && !principalIdIsString) {
          principalId = principalId.toString();
        }

        if (principalType && principalId) {
          roleMappingModel.findOne({where: {roleId: roleId,
            principalType: principalType, principalId: principalId}},
          function(err, result) {
            debug('Role mapping found: %j', result);
            done(!err && result); // The only arg is the result
          });
        } else {
          process.nextTick(function() {
            done(false);
          });
        }
      }, function(inRole) {
        debug('isInRole() returns: %j', inRole);
        if (callback) callback(null, inRole);
      });
    });
    return callback.promise;
  };

  /**
   * List roles for a given principal.
   * @param {Object} context The security context.
   *
   * @callback {Function} callback Callback function.
   * @param {Error} err Error object.
   * @param {String[]} roles An array of role IDs
   * @promise
   */
  Role.getRoles = function(context, options, callback) {
    if (!callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      } else {
        callback = utils.createPromiseCallback();
      }
    }
    if (!options) options = {};

    context.registry = this.registry;
    if (!(context instanceof AccessContext)) {
      context = new AccessContext(context);
    }
    var roles = [];
    this.resolveRelatedModels();

    var addRole = function(role) {
      if (role && roles.indexOf(role) === -1) {
        roles.push(role);
      }
    };

    var self = this;
    // Check against the smart roles
    var inRoleTasks = [];
    Object.keys(Role.resolvers).forEach(function(role) {
      inRoleTasks.push(function(done) {
        self.isInRole(role, context, function(err, inRole) {
          if (debug.enabled) {
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

    var roleMappingModel = this.roleMappingModel;
    context.principals.forEach(function(p) {
      // Check against the role mappings
      var principalType = p.type || undefined;
      var principalId = p.id == null ? undefined : p.id;

      if (typeof principalId !== 'string' && principalId != null) {
        principalId = principalId.toString();
      }

      // Add the role itself
      if (principalType === RoleMapping.ROLE && principalId) {
        addRole(principalId);
      }

      if (principalType && principalId) {
        // Please find() treat undefined matches all values
        inRoleTasks.push(function(done) {
          var filter = {where: {principalType: principalType, principalId: principalId}};
          if (options.returnOnlyRoleNames === true) {
            filter.include = ['role'];
          }
          roleMappingModel.find(filter, function(err, mappings) {
            debug('Role mappings found: %s %j', err, mappings);
            if (err) {
              if (done) done(err);
              return;
            }
            mappings.forEach(function(m) {
              var role;
              if (options.returnOnlyRoleNames === true) {
                role = m.toJSON().role.name;
              } else {
                role = m.roleId;
              }
              addRole(role);
            });
            if (done) done();
          });
        });
      }
    });

    async.parallel(inRoleTasks, function(err, results) {
      debug('getRoles() returns: %j %j', err, roles);
      if (callback) callback(err, roles);
    });
    return callback.promise;
  };

  Role.validatesUniquenessOf('name', {message: 'already exists'});
};
