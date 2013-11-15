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

var loopback = require('../loopback');
var async = require('async');
var assert = require('assert');

var role = require('./role');
var Role = role.Role;

/**
 * Schema for Scope which represents the permissions that are granted to client applications by the resource owner
 */
var ScopeSchema = {
  name: {type: String, required: true},
  description: String
};


/**
 * Resource owner grants/delegates permissions to client applications
 *
 * For a protected resource, does the client application have the authorization from the resource owner (user or system)?
 *
 * Scope has many resource access entries
 * @type {createModel|*}
 */
var Scope = loopback.createModel('Scope', ScopeSchema);

/**
 * System grants permissions to principals (users/applications, can be grouped into roles).
 *
 * Protected resource: the model data and operations (model/property/method/relation/…)
 *
 * For a given principal, such as client application and/or user, is it allowed to access (read/write/execute)
 * the protected resource?
 *
 */
var ACLSchema = {
  model: String, // The name of the model
  property: String, // The name of the property, method, scope, or relation

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
  permission: String,
  /**
   * Type of the principal - Application/User/Role
   */
  principalType: String,
  /**
   * Id of the principal - such as appId, userId or roleId
   */
  principalId: String
};

var ACL = loopback.createModel('ACL', ACLSchema);

ACL.ALL = '*';

ACL.DEFAULT = 'DEFAULT';
ACL.ALLOW = 'ALLOW';
ACL.ALARM = 'ALARM';
ACL.AUDIT = 'AUDIT';
ACL.DENY = 'DENY';

ACL.READ = 'READ';
ACL.WRITE = 'WRITE';
ACL.EXECUTE = 'EXECUTE';

ACL.USER = 'USER';
ACL.APP = ACL.APPLICATION = 'APP';
ACL.ROLE = 'ROLE';
ACL.SCOPE = 'SCOPE';

var permissionOrder = {
  DEFAULT: 0,
  ALLOW: 1,
  ALARM: 2,
  AUDIT: 3,
  DENY: 4
};

function overridePermission(p1, p2) {
  p1 = permissionOrder[p1] ? p1 : ACL.ALLOW;
  p2 = permissionOrder[p2] ? p2 : ACL.ALLOW;
  var i1 = permissionOrder[p1];
  var i2 = permissionOrder[p2];
  return i1 > i2 ? p1 : p2;
}

/*!
 * Resolve permission from the ACLs
 * @param acls
 * @param defaultPermission
 * @returns {*|Object|Mixed}
 */
function resolvePermission(acls, defaultPermission) {
  var resolvedPermission = acls.reduce(function (previousValue, currentValue, index, array) {
    // If the property is the same or the previous one is ACL.ALL (ALL)
    if (previousValue.property === currentValue.property || (previousValue.property === ACL.ALL && currentValue.property)) {
      previousValue.property = currentValue.property;
      // Check if the accessType applies
      if (previousValue.accessType === currentValue.accessType
        || previousValue.accessType === ACL.ALL
        || currentValue.accessType === ACL.ALL
        || !currentValue.accessType) {
        previousValue.permission = overridePermission(previousValue.permission, currentValue.permission);
      }
    }
    return previousValue;
  }, defaultPermission);
  return resolvedPermission;
}

/*!
 * Check the LDL ACLs
 * @param principalType
 * @param principalId
 * @param {String} model The model name
 * @param {String} property The property/method/relation name
 * @param {String} accessType The access type
 *
 * @returns {{principalType: *, principalId: *, model: *, property: string, accessType: *, permission: string}}
 */
function getStaticPermission(principalType, principalId, model, property, accessType) {
  var modelClass = loopback.getModel(model);
  var staticACLs = [];
  if (modelClass && modelClass.settings.acls) {
    modelClass.settings.acls.forEach(function (acl) {
      staticACLs.push({
        model: model,
        property: acl.property || ACL.ALL,
        principalType: acl.principalType,
        principalId: acl.principalId, // TODO: Should it be a name?
        accessType: acl.accessType,
        permission: acl.permission
      });
    });
  }
  var prop = modelClass &&
    (modelClass.definition.properties[property] // regular property
      || (modelClass._scopeMeta && modelClass._scopeMeta[property]) // relation/scope
      || modelClass[property] // static method
      || modelClass.prototype[property]); // prototype method
  if (prop && prop.acls) {
    prop.acls.forEach(function (acl) {
      staticACLs.push({
        model: modelClass.modelName,
        property: property,
        principalType: acl.principalType,
        principalId: acl.principalId,
        accessType: acl.accessType,
        permission: acl.permission
      });
    });
  }

  var defaultPermission = {principalType: principalType, principalId: principalId,
    model: model, property: ACL.ALL, accessType: accessType, permission: ACL.ALLOW};

  defaultPermission = resolvePermission(staticACLs, defaultPermission);
  return defaultPermission;
}

/**
 * Check if the given principal is allowed to access the model/property
 * @param {String} principalType The principal type
 * @param {String} principalId The principal id
 * @param {String} model The model name
 * @param {String} property The property/method/relation name
 * @param {String} accessType The access type
 * @param {Function} callback The callback function
 *
 * @callback callback
 * @param {String|Error} err The error object
 * @param {Object} the access permission
 */
ACL.checkPermission = function (principalType, principalId, model, property, accessType, callback) {
  property = property || ACL.ALL;
  var propertyQuery = (property === ACL.ALL) ? undefined : {inq: [property, ACL.ALL]};
  accessType = accessType || ACL.ALL;
  var accessTypeQuery = (accessType === ACL.ALL) ? undefined : {inq: [accessType, ACL.ALL]};
  var defaultPermission = getStaticPermission(principalType, principalId, model, property, accessType);
  if(defaultPermission.permission === ACL.DENY) {
    // Fail fast
    process.nextTick(function() {
      callback && callback(null, defaultPermission);
    });
    return;
  }

  ACL.find({where: {principalType: principalType, principalId: principalId,
      model: model, property: propertyQuery, accessType: accessTypeQuery}},
    function (err, acls) {
      if (err) {
        callback && callback(err);
        return;
      }
      var resolvedPermission = resolvePermission(acls, defaultPermission);
      if(resolvedPermission.permission === ACL.DEFAULT) {
        var modelClass = loopback.getModel(model);
        resolvedPermission.permission = (modelClass && modelClass.settings.defaultPermission) || ACL.ALLOW;
      }
      callback && callback(null, resolvedPermission);
    });
};

/**
 * Check if the given scope is allowed to access the model/property
 * @param {String} scope The scope name
 * @param {String} model The model name
 * @param {String} property The property/method/relation name
 * @param {String} accessType The access type
 * @param {Function} callback The callback function
 *
 * @callback callback
 * @param {String|Error} err The error object
 * @param {Object} the access permission
 */
Scope.checkPermission = function (scope, model, property, accessType, callback) {
  Scope.findOne({where: {name: scope}}, function (err, scope) {
    if (err) {
      callback && callback(err);
    } else {
      ACL.checkPermission(ACL.SCOPE, scope.id, model, property, accessType, callback);
    }
  });
};

/**
 * Check if the request has the permission to access
 * @param {Object} context
 * @param {Function} callback
 */
ACL.checkAccess = function (context, callback) {
  context = context || {};
  var principals = context.principals || [];

  // add ROLE.EVERYONE
  principals.unshift({principalType: ACL.ROLE, principalId: Role.EVERYONE});

  var model = context.model;
  model = ('string' === typeof model) ? loopback.getModel(model) : model;
  var id = context.id;
  var property = context.property;
  var accessType = context.accessType;

  property = property || ACL.ALL;
  var propertyQuery = (property === ACL.ALL) ? undefined : {inq: [property, ACL.ALL]};
  accessType = accessType || ACL.ALL;
  var accessTypeQuery = (accessType === ACL.ALL) ? undefined : {inq: [accessType, ACL.ALL]};

  var defaultPermission = {principalType: null, principalId: null,
    model: model.modelName, property: ACL.ALL, accessType: accessType, permission: ACL.ALLOW};

  // Check the LDL ACLs
  principals.forEach(function(p) {
    var perm = getStaticPermission(p.principalType, p.principalId, model.modelName, property, accessType);
    defaultPermission = resolvePermission([perm], defaultPermission);
  });

  if(defaultPermission.permission === ACL.DENY) {
    // Fail fast
    process.nextTick(function() {
      callback && callback(null, defaultPermission);
    });
    return;
  }

  ACL.find({where: {model: model.modelName, property: propertyQuery, accessType: accessTypeQuery}}, function (err, acls) {
    if (err) {
      callback && callback(err);
      return;
    }
    var effectiveACLs = [];
    var inRoleTasks = [];
    acls.forEach(function (acl) {
      principals.forEach(function (principal) {
        if (principal.principalType === acl.pricipalType && principal.principalId === acl.principalId) {
          effectiveACLs.push(acl);
        } else if (acl.principalType === ACL.ROLE) {
          inRoleTasks.push(function (done) {
            Role.isInRole(acl.principalId,
              {principalType: principal.principalType, principalId: acl.principalId, model: model, id: id, property: property},
              function (err, inRole) {
                if(!err) {
                  effectiveACLs.push(acl);
                }
                done(err, acl);
              });
          });
        }
      });
    });

    async.parallel(inRoleTasks, function(err, results) {
      defaultPermission = resolvePermission(effectiveACLs, defaultPermission);
      callback && callback(null, defaultPermission);
    });
  });
};


/**
 * Check if the given access token can invoke the method
 * @param {AccessToken} token The access token
 * @param {String} model The model name
 * @param {*} modelId The model id
 * @param {String} method The method name
 * @param callback The callback function
 *
 * @callback callback
 * @param {String|Error} err The error object
 * @param {Boolean} allowed is the request allowed
 */
ACL.checkAccessForToken = function(token, model, modelId, method, callback) {
  assert(token, 'Access token is required');
  var principals = [];
  if(token.userId) {
    principals.push({principalType: ACL.USER, principalId: token.userId});
  }
  if(token.appId) {
    principals.push({principalType: ACL.APPLICATION, principalId: token.appId});
  }
  var context = {
    principals: principals,
    model: model,
    property: method,
    accessType: ACL.EXECUTE,
    id: modelId
  };
  ACL.checkAccess(context, function(err, access) {
    if(err) {
      callback && callback(err);
      return;
    }
    callback && callback(null, access.permission !== ACL.DENY);
  });
};


module.exports = {
  ACL: ACL,
  Scope: Scope
};
