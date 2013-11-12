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

var ScopeACLSchema = {
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
  scopeId: Number
};

var ScopeACL = loopback.createModel('ScopeACL', ScopeACLSchema, {
  relations: {
    scope: {
      type: 'belongsTo',
      model: 'Scope',
      foreignKey: 'scopeId'
    }
  }
});

/**
 * Resource owner grants/delegates permissions to client applications
 *
 * For a protected resource, does the client application have the authorization from the resource owner (user or system)?
 *
 * Scope has many resource access entries
 * @type {createModel|*}
 */
var Scope = loopback.createModel('Scope', ScopeSchema, {
  relations: {
    resources: {
      type: 'hasMany',
      model: 'ScopeACL',
      foreignKey: 'scopeId'
    }
  }
});

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

module.exports = {
  ACL: ACL,
  Scope: Scope,
  ScopeACL: ScopeACL
};

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
  ACL.find({where: {principalType: principalType, principalId: principalId,
      model: model, property: {inq: [property, '*']}, accessType: {inq: [accessType, '*']}}},
    function (err, acls) {
      if (err) {
        callback && callback(err);
        return;
      }
      var resolvedPermission = acls.reduce(function (previousValue, currentValue, index, array) {
        // If the property is the same or the previous one is '*' (ALL)
        if (previousValue.property === currentValue.property || (previousValue.property === '*' && currentValue.property)) {
          previousValue.property = currentValue.property;
          if (previousValue.accessType === currentValue.accessType || (previousValue.accessType === '*' && currentValue.accessType)) {
            previousValue.accessType = currentValue.accessType;
          }
        }
        return previousValue;
      }, {principalType: principalType, principalId: principalId, model: model, property: '*', accessType: '*', permission: 'Allow'});
      callback && callback(resolvedPermission);
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
      scope.resources({where: {model: model, property: {inq: [property, '*']}, accessType: {inq: [accessType, '*']}}}, function (err, resources) {
          if (err) {
            callback && callback(err);
            return;
          }
          // Try to resolve the permission
          var resolvedPermission = resources.reduce(function (previousValue, currentValue, index, array) {
            // If the property is the same or the previous one is '*' (ALL)
            if (previousValue.property === currentValue.property || (previousValue.property === '*' && currentValue.property)) {
              previousValue.property = currentValue.property;
              if (previousValue.accessType === currentValue.accessType || (previousValue.accessType === '*' && currentValue.accessType)) {
                previousValue.accessType = currentValue.accessType;
              }
            }
            return previousValue;
          }, {model: model, property: '*', accessType: '*', permission: 'Allow'});
          callback && callback(resolvedPermission);
        }
      );
    }
  });
};