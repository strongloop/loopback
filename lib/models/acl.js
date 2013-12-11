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
var debug = require('debug')('acl');

var role = require('./role');
var Role = role.Role;

/**
 * Schema for Scope which represents the permissions that are granted to client
 * applications by the resource owner
 */
var ScopeSchema = {
  name: {type: String, required: true},
  description: String
};


/**
 * Resource owner grants/delegates permissions to client applications
 *
 * For a protected resource, does the client application have the authorization
 * from the resource owner (user or system)?
 *
 * Scope has many resource access entries
 * @type {createModel|*}
 */
var Scope = loopback.createModel('Scope', ScopeSchema);

/**
 * System grants permissions to principals (users/applications, can be grouped
 * into roles).
 *
 * Protected resource: the model data and operations
 * (model/property/method/relation/…)
 *
 * For a given principal, such as client application and/or user, is it allowed
 * to access (read/write/execute)
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
   * ALARM - Generate an alarm, in a system dependent way, the access specified
   * in the permissions component of the ACL entry.
   * ALLOW - Explicitly grants access to the resource.
   * AUDIT - Log, in a system dependent way, the access specified in the
   * permissions component of the ACL entry.
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

ACL.DEFAULT = 'DEFAULT'; // Not specified
ACL.ALLOW = 'ALLOW'; // Allow
ACL.ALARM = 'ALARM'; // Warn - send an alarm
ACL.AUDIT = 'AUDIT'; // Audit - record the access
ACL.DENY = 'DENY'; // Deny

ACL.READ = 'READ'; // Read operation
ACL.WRITE = 'WRITE'; // Write operation
ACL.EXECUTE = 'EXECUTE'; // Execute operation

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

/**
 * Calculate the matching score for the given rule and request
 * @param {Object} rule The ACL entry
 * @param {Object} req The request
 * @returns {number}
 */
function getMatchingScore(rule, req) {
  var props = ['model', 'property', 'accessType'];
  var score = 0;
  for (var i = 0; i < props.length; i++) {
    // Shift the score by 4 for each of the properties as the weight
    score = score * 4;
    var val1 = rule[props[i]] || ACL.ALL;
    var val2 = req[props[i]] || ACL.ALL;
    if (val1 === val2) {
      // Exact match
      score += 3;
    } else if (val1 === ACL.ALL) {
      // Wildcard match
      score += 2;
    } else if (val2 === ACL.ALL) {
      // Doesn't match at all
      score += 1;
    } else {
      return -1;
    }
  }
  score = score * 4;
  score += permissionOrder[rule.permission || ACL.ALLOW] - 1;
  return score;
}

/*!
 * Resolve permission from the ACLs
 * @param {Object[]) acls The list of ACLs
 * @param {Object} req The request
 * @returns {Object} The effective ACL
 */
function resolvePermission(acls, req) {
  // Sort by the matching score in descending order
  acls = acls.sort(function (rule1, rule2) {
    return getMatchingScore(rule2, req) - getMatchingScore(rule1, req);
  });
  var permission = ACL.DEFAULT;
  var score = 0;
  for (var i = 0; i < acls.length; i++) {
    score = getMatchingScore(acls[i], req);
    if (score < 0) {
      break;
    }
    if (req.model !== ACL.ALL &&
      req.property !== ACL.ALL &&
      req.accessType !== ACL.ALL) {
      // We should stop from the first match for non-wildcard
      permission = acls[i].permission;
      break;
    } else {
      if(acls[i].model === req.model &&
        acls[i].property === req.property &&
        acls[i].accessType === req.accessType
        ) {
        // We should stop at the exact match
        permission = acls[i].permission;
        break;
      }
      // For wildcard match, find the strongest permission
      if(permissionOrder[acls[i].permission] > permissionOrder[permission]) {
        permission = acls[i].permission;
      }
    }
  }

  return {
    model: req.model,
    property: req.property,
    accessType: req.accessType,
    permission: permission || ACL.DEFAULT
  };
}

/*!
 * Get the static ACLs from the model definition
 * @param {String} model The model name
 * @param {String} property The property/method/relation name
 *
 * @return {Object[]} An array of ACLs
 */
function getStaticACLs(model, property) {
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

  return staticACLs;
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

  var req = {
    model: model,
    property: property,
    accessType: accessType
  };

  var acls = getStaticACLs(model, property);

  var resolved = resolvePermission(acls, req);

  if(resolved && resolved.permission === ACL.DENY) {
    // Fail fast
    process.nextTick(function() {
      callback && callback(null, resolved);
    });
    return;
  }

  ACL.find({where: {principalType: principalType, principalId: principalId,
      model: model, property: propertyQuery, accessType: accessTypeQuery}},
    function (err, dynACLs) {
      if (err) {
        callback && callback(err);
        return;
      }
      acls = acls.concat(dynACLs);
      resolved = resolvePermission(acls, req);
      if(resolved && resolved.permission === ACL.DEFAULT) {
        var modelClass = loopback.getModel(model);
        resolved.permission = (modelClass && modelClass.settings.defaultPermission) || ACL.ALLOW;
      }
      callback && callback(null, resolved);
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
 * @property {Object[]} principals An array of principals
 * @property {String|Model} model The model name or model class
 * @property {*} id The model instance id
 * @property {String} property The property/method/relation name
 * @property {String} accessType The access type
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

  var req = {
    model: model.modelName,
    property: property,
    accessType: accessType
  };

  var effectiveACLs = [];
  var staticACLs = getStaticACLs(model.modelName, property);

  ACL.find({where: {model: model.modelName, property: propertyQuery,
    accessType: accessTypeQuery}}, function (err, acls) {
    if (err) {
      callback && callback(err);
      return;
    }
    var inRoleTasks = [];

    acls = acls.concat(staticACLs);

    acls.forEach(function (acl) {
      principals.forEach(function (principal) {
        if (principal.principalType === acl.principalType
          && String(principal.principalId) === String(acl.principalId)) {
          effectiveACLs.push(acl);
        } else if (acl.principalType === ACL.ROLE) {
          inRoleTasks.push(function (done) {
            Role.isInRole(acl.principalId,
               {principalType: principal.principalType,
                principalId: principal.principalId,
                userId: context.userId,
                model: model, id: id, property: property},
              function (err, inRole) {
                if(!err && inRole) {
                  effectiveACLs.push(acl);
                }
                done(err, acl);
              });
          });
        }
      });
    });

    async.parallel(inRoleTasks, function(err, results) {
      resolved = resolvePermission(effectiveACLs, req);
      callback && callback(null, resolved);
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

  var modelCtor = loopback.getModel(model);

  var context = {
    userId: token.userId,
    principals: principals,
    model: model,
    property: method,
    accessType: modelCtor._getAccessTypeForMethod(method),
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
