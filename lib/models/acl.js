/*!
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
var debug = require('debug')('loopback:security:acl');

var ctx = require('./access-context');
var AccessContext = ctx.AccessContext;
var Principal = ctx.Principal;
var AccessRequest = ctx.AccessRequest;

var role = require('./role');
var Role = role.Role;

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

/**
 * A Model for access control meta data.
 *
 * @header ACL
 * @class
 * @inherits Model
 */

var ACL = loopback.createModel('ACL', ACLSchema);

ACL.ALL = AccessContext.ALL;

ACL.DEFAULT = AccessContext.DEFAULT; // Not specified
ACL.ALLOW = AccessContext.ALLOW; // Allow
ACL.ALARM = AccessContext.ALARM; // Warn - send an alarm
ACL.AUDIT = AccessContext.AUDIT; // Audit - record the access
ACL.DENY = AccessContext.DENY; // Deny

ACL.READ = AccessContext.READ; // Read operation
ACL.WRITE = AccessContext.WRITE; // Write operation
ACL.EXECUTE = AccessContext.EXECUTE; // Execute operation

ACL.USER = Principal.USER;
ACL.APP = ACL.APPLICATION = Principal.APPLICATION;
ACL.ROLE = Principal.ROLE;
ACL.SCOPE = Principal.SCOPE;

/**
 * Calculate the matching score for the given rule and request
 * @param {ACL} rule The ACL entry
 * @param {AccessRequest} req The request
 * @returns {number}
 */
ACL.getMatchingScore = function getMatchingScore(rule, req) {
  var props = ['model', 'property', 'accessType'];
  var score = 0;

  for (var i = 0; i < props.length; i++) {
    // Shift the score by 4 for each of the properties as the weight
    score = score * 4;
    var val1 = rule[props[i]] || ACL.ALL;
    var val2 = req[props[i]] || ACL.ALL;
    var isMatchingMethodName = props[i] === 'property' && req.methodNames.indexOf(val1) !== -1;

    if (val1 === val2 || isMatchingMethodName) {
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

  // Weigh against the principal type into 4 levels
  // - user level (explicitly allow/deny a given user)
  // - app level (explicitly allow/deny a given app)
  // - role level (role based authorization)
  // - other
  // user > app > role > ...
  score = score * 4;
  switch(rule.principalType) {
    case ACL.USER:
      score += 4;
      break;
    case ACL.APP:
      score += 3;
      break;
    case ACL.ROLE:
      score += 2;
      break;
    default:
      score +=1;
  }

  // Weigh against the roles
  // everyone < authenticated/unauthenticated < related < owner < ...
  score = score * 8;
  if(rule.principalType === ACL.ROLE) {
    switch(rule.principalId) {
      case Role.OWNER:
        score += 4;
        break;
      case Role.RELATED:
        score += 3;
        break;
      case Role.AUTHENTICATED:
      case Role.UNAUTHENTICATED:
        score += 2;
        break;
      case Role.EVERYONE:
        score += 1;
        break;
      default:
        score += 5;
    }
  }
  score = score * 4;
  score += AccessContext.permissionOrder[rule.permission || ACL.ALLOW] - 1;
  return score;
};

/**
 * Get matching score for the given `AccessRequest`.
 * @param {AccessRequest} req The request
 * @returns {Number} score
 */

ACL.prototype.score = function(req) {
  return this.constructor.getMatchingScore(this, req);
}

/*!
 * Resolve permission from the ACLs
 * @param {Object[]) acls The list of ACLs
 * @param {Object} req The request
 * @returns {AccessRequest} result The effective ACL
 */
ACL.resolvePermission = function resolvePermission(acls, req) {
  if(!(req instanceof AccessRequest)) {
    req = new AccessRequest(req);
  }
  // Sort by the matching score in descending order
  acls = acls.sort(function (rule1, rule2) {
    return ACL.getMatchingScore(rule2, req) - ACL.getMatchingScore(rule1, req);
  });
  var permission = ACL.DEFAULT;
  var score = 0;

  for (var i = 0; i < acls.length; i++) {
    score = ACL.getMatchingScore(acls[i], req);
    if (score < 0) {
      // the highest scored ACL did not match
      break;
    }
    if (!req.isWildcard()) {
      // We should stop from the first match for non-wildcard
      permission = acls[i].permission;
      break;
    } else {
      if(req.exactlyMatches(acls[i])) {
        permission = acls[i].permission;
        break;
      }
      // For wildcard match, find the strongest permission
      if(AccessContext.permissionOrder[acls[i].permission]
        > AccessContext.permissionOrder[permission]) {
        permission = acls[i].permission;
      }
    }
  }

  if(debug.enabled) {
    debug('The following ACLs were searched: ');
    acls.forEach(function(acl) {
      acl.debug();
      debug('with score:', acl.score(req));
    });
  }

  var res = new AccessRequest(req.model, req.property, req.accessType,
    permission || ACL.DEFAULT);
  return res;
};

/*!
 * Get the static ACLs from the model definition
 * @param {String} model The model name
 * @param {String} property The property/method/relation name
 *
 * @return {Object[]} An array of ACLs
 */
ACL.getStaticACLs = function getStaticACLs(model, property) {
  var modelClass = loopback.getModel(model);
  var staticACLs = [];
  if (modelClass && modelClass.settings.acls) {
    modelClass.settings.acls.forEach(function (acl) {
      staticACLs.push(new ACL({
        model: model,
        property: acl.property || ACL.ALL,
        principalType: acl.principalType,
        principalId: acl.principalId, // TODO: Should it be a name?
        accessType: acl.accessType || ACL.ALL,
        permission: acl.permission
      }));
    });
  }
  var prop = modelClass &&
    (modelClass.definition.properties[property] // regular property
      || (modelClass._scopeMeta && modelClass._scopeMeta[property]) // relation/scope
      || modelClass[property] // static method
      || modelClass.prototype[property]); // prototype method
  if (prop && prop.acls) {
    prop.acls.forEach(function (acl) {
      staticACLs.push(new ACL({
        model: modelClass.modelName,
        property: property,
        principalType: acl.principalType,
        principalId: acl.principalId,
        accessType: acl.accessType,
        permission: acl.permission
      }));
    });
  }
  return staticACLs;
};

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
 * @param {AccessRequest} result The access permission
 */
ACL.checkPermission = function checkPermission(principalType, principalId,
                                               model, property, accessType,
                                               callback) {
  if(principalId !== null && principalId !== undefined && (typeof principalId !== 'string') ) {
    principalId = principalId.toString();
  }
  property = property || ACL.ALL;
  var propertyQuery = (property === ACL.ALL) ? undefined : {inq: [property, ACL.ALL]};
  accessType = accessType || ACL.ALL;
  var accessTypeQuery = (accessType === ACL.ALL) ? undefined : {inq: [accessType, ACL.ALL]};

  var req = new AccessRequest(model, property, accessType);

  var acls = this.getStaticACLs(model, property);

  var resolved = this.resolvePermission(acls, req);

  if(resolved && resolved.permission === ACL.DENY) {
    debug('Permission denied by statically resolved permission');
    debug(' Resolved Permission: %j', resolved);
    process.nextTick(function() {
      callback && callback(null, resolved);
    });
    return;
  }

  var self = this;
  this.find({where: {principalType: principalType, principalId: principalId,
      model: model, property: propertyQuery, accessType: accessTypeQuery}},
    function (err, dynACLs) {
      if (err) {
        callback && callback(err);
        return;
      }
      acls = acls.concat(dynACLs);
      resolved = self.resolvePermission(acls, req);
      if(resolved && resolved.permission === ACL.DEFAULT) {
        var modelClass = loopback.getModel(model);
        resolved.permission = (modelClass && modelClass.settings.defaultPermission) || ACL.ALLOW;
      }
      callback && callback(null, resolved);
    });
};

ACL.prototype.debug = function() {
  if(debug.enabled) {
    debug('---ACL---');
    debug('model %s', this.model);
    debug('property %s', this.property);
    debug('principalType %s', this.principalType);
    debug('principalId %s', this.principalId);
    debug('accessType %s', this.accessType);
    debug('permission %s', this.permission);
  }
}

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

ACL.checkAccessForContext = function (context, callback) {
  if(!(context instanceof AccessContext)) {
    context = new AccessContext(context);
  }

  var model = context.model;
  var property = context.property;
  var accessType = context.accessType;
  var modelName = context.modelName;

  var methodNames = context.methodNames;
  var propertyQuery = (property === ACL.ALL) ? undefined : {inq: methodNames.concat([ACL.ALL])};
  var accessTypeQuery = (accessType === ACL.ALL) ? undefined : {inq: [accessType, ACL.ALL]};

  var req = new AccessRequest(modelName, property, accessType, ACL.DEFAULT, methodNames);

  var effectiveACLs = [];
  var staticACLs = this.getStaticACLs(model.modelName, property);

  var self = this;
  var roleModel = loopback.getModelByType(Role);
  this.find({where: {model: model.modelName, property: propertyQuery,
    accessType: accessTypeQuery}}, function (err, acls) {
    if (err) {
      callback && callback(err);
      return;
    }
    var inRoleTasks = [];

    acls = acls.concat(staticACLs);

    acls.forEach(function (acl) {
      // Check exact matches
      for (var i = 0; i < context.principals.length; i++) {
        var p = context.principals[i];
        if (p.type === acl.principalType
          && String(p.id) === String(acl.principalId)) {
          effectiveACLs.push(acl);
          return;
        }
      }

      // Check role matches
      if (acl.principalType === ACL.ROLE) {
        inRoleTasks.push(function (done) {
          roleModel.isInRole(acl.principalId, context,
            function (err, inRole) {
              if (!err && inRole) {
                effectiveACLs.push(acl);
              }
              done(err, acl);
            });
        });
      }
    });

    async.parallel(inRoleTasks, function (err, results) {
      if(err) {
        callback && callback(err, null);
        return;
      }
      var resolved = self.resolvePermission(effectiveACLs, req);
      if(resolved && resolved.permission === ACL.DEFAULT) {
        resolved.permission = (model && model.settings.defaultPermission) || ACL.ALLOW;
      }
      debug('---Resolved---');
      resolved.debug();
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
 * @end
 * @callback {Function} callback
 * @param {String|Error} err The error object
 * @param {Boolean} allowed is the request allowed
 */
ACL.checkAccessForToken = function (token, model, modelId, method, callback) {
  assert(token, 'Access token is required');

  var context = new AccessContext({
    accessToken: token,
    model: model,
    property: method,
    method: method,
    modelId: modelId
  });

  this.checkAccessForContext(context, function (err, access) {
    if (err) {
      callback && callback(err);
      return;
    }
    callback && callback(null, access.permission !== ACL.DENY);
  });
};

/*!
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
 * @class
 */
var Scope = loopback.createModel('Scope', ScopeSchema);


/**
 * Check if the given scope is allowed to access the model/property
 * @param {String} scope The scope name
 * @param {String} model The model name
 * @param {String} property The property/method/relation name
 * @param {String} accessType The access type
 * @callback {Function} callback
 * @param {String|Error} err The error object
 * @param {AccessRequest} result The access permission
 */
Scope.checkPermission = function (scope, model, property, accessType, callback) {
  this.findOne({where: {name: scope}}, function (err, scope) {
    if (err) {
      callback && callback(err);
    } else {
      var aclModel = loopback.getModelByType(ACL);
      aclModel.checkPermission(ACL.SCOPE, scope.id, model, property, accessType, callback);
    }
  });
};

module.exports.ACL = ACL;
module.exports.Scope = Scope;
