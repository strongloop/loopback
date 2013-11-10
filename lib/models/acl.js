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

var ScopeSchema = {
  name: {type: String, required: true},
  description: String
};

var ScopeResourceAccessSchema = {
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

var ScopeResourceAccess = loopback.createModel('ScopeResourceAccess', ScopeResourceAccessSchema, {
  relations: {
    scope: {
      type: 'belongsTo',
      model: 'Scope',
      foreignKey: 'scopeId'
    }
  }
});

/**
 * Scope has many resource access entries
 * @type {createModel|*}
 */
var Scope = loopback.createModel('Scope', ScopeSchema, {
  relations: {
    resources: {
      type: 'hasMany',
      model: 'ScopeResourceAccess',
      foreignKey: 'scopeId'
    }
  }
});

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
  ScopeResourceAccess: ScopeResourceAccess
};

Scope.isAllowed = function (scope, model, property, accessType, callback) {
  Scope.findOne({where: {name: scope}}, function (err, scope) {
    if (err) {
      callback && callback(err);
    } else {
      scope.resources({where: {model: model, property: {inq: [property, '*']}, accessType: {inq: [accessType, '*']}}}, function (err, resources)
      {
        if (err) {
          callback && callback(err);
        } else {
          console.log('Resources: ', resources);
          for (var r = 0; r < resources.length; r++) {
            if (resources[r].permission === 'Allow') {
              callback && callback(null, true);
              return;
            }
          }
          callback && callback(null, false);
        }

      }
    )
      ;
    }
  });
};