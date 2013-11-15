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

/**
 * Check if the given principal is allowed to access the model/property
 * @param principalType
 * @param principalId
 * @param model
 * @param property
 * @param accessType
 * @param callback
 */
ACL.checkPermission = function (principalType, principalId, model, property, accessType, callback) {
  property = property || ACL.ALL;
  var propertyQuery = (property === ACL.ALL) ? undefined : {inq: [property, ACL.ALL]};
  accessType = accessType || ACL.ALL;
  var accessTypeQuery = (accessType === ACL.ALL) ? undefined : {inq: [accessType, ACL.ALL]};

  var staticACLs = [];
  var modelClass = loopback.getModel(model); {
    if(modelClass && modelClass.settings.acls) {
      modelClass.settings.acls.forEach(function(acl) {
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
    if(prop && prop.acls) {
      prop.acls.forEach(function(acl) {
        staticACLs.push({
          model: model,
          property: property,
          principalType: acl.principalType,
          principalId: acl.principalId,
          accessType: acl.accessType,
          permission: acl.permission
        });
      });
    }
  }

  var defaultPermission = {principalType: principalType, principalId: principalId,
    model: model, property: ACL.ALL, accessType: accessType, permission: ACL.ALLOW};

  defaultPermission = resolvePermission(staticACLs, defaultPermission);

  if(defaultPermission.permission === ACL.DENY) {
    // Fail fast
    callback && callback(null, defaultPermission);
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
      callback && callback(null, resolvedPermission);
    });
};

/**
 * Check if the given scope is allowed to access the model/property
 * @param scope
 * @param model
 * @param property
 * @param accessType
 * @param callback
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


module.exports = {
  ACL: ACL,
  Scope: Scope
};
