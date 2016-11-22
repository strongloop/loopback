// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
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

var g = require('../../lib/globalize');
var loopback = require('../../lib/loopback');
var async = require('async');
var assert = require('assert');
var debug = require('debug')('loopback:security:acl');

var ctx = require('../../lib/access-context');
var AccessContext = ctx.AccessContext;
var Principal = ctx.Principal;
var AccessRequest = ctx.AccessRequest;

var Role = loopback.Role;
assert(Role, 'Role model must be defined before ACL model');

/**
 * A Model for access control meta data.
 *
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
 * @header ACL
 * @property {String} model Name of the model.
 * @property {String} property Name of the property, method, scope, or relation.
 * @property {String} accessType Type of access being granted: one of READ, WRITE, or EXECUTE.
 * @property {String} permission Type of permission granted. One of:
 *
 *  - ALARM: Generate an alarm, in a system-dependent way, the access specified in the permissions component of the ACL entry.
 *  - ALLOW: Explicitly grants access to the resource.
 *  - AUDIT: Log, in a system-dependent way, the access specified in the permissions component of the ACL entry.
 *  - DENY: Explicitly denies access to the resource.
 * @property {String} principalType Type of the principal; one of: Application, User, Role.
 * @property {String} principalId ID of the principal - such as appId, userId or roleId.
 * @property {Object} settings Extends the `Model.settings` object.
 * @property {String} settings.defaultPermission Default permission setting: ALLOW, DENY, ALARM, or AUDIT. Default is ALLOW.
 * Set to DENY to prohibit all API access by default.
 *
 * @class ACL
 * @inherits PersistedModel
 */

module.exports = function(ACL) {
  ACL.ALL = AccessContext.ALL;

  ACL.DEFAULT = AccessContext.DEFAULT; // Not specified
  ACL.ALLOW = AccessContext.ALLOW; // Allow
  ACL.ALARM = AccessContext.ALARM; // Warn - send an alarm
  ACL.AUDIT = AccessContext.AUDIT; // Audit - record the access
  ACL.DENY = AccessContext.DENY; // Deny

  ACL.READ = AccessContext.READ; // Read operation
  ACL.REPLICATE = AccessContext.REPLICATE; // Replicate (pull) changes
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
   * @returns {Number}
   */
  ACL.getMatchingScore = function getMatchingScore(rule, req) {
    var props = ['model', 'property', 'accessType'];
    var score = 0;

    for (var i = 0; i < props.length; i++) {
      // Shift the score by 4 for each of the properties as the weight
      score = score * 4;
      var ruleValue = rule[props[i]] || ACL.ALL;
      var requestedValue = req[props[i]] || ACL.ALL;
      var isMatchingMethodName = props[i] === 'property' &&
        req.methodNames.indexOf(ruleValue) !== -1;

      var isMatchingAccessType = ruleValue === requestedValue;
      if (props[i] === 'accessType' && !isMatchingAccessType) {
        switch (ruleValue) {
          case ACL.EXECUTE:
            // EXECUTE should match READ, REPLICATE and WRITE
            isMatchingAccessType = true;
            break;
          case ACL.WRITE:
            // WRITE should match REPLICATE too
            isMatchingAccessType = requestedValue === ACL.REPLICATE;
            break;
        }
      }

      if (isMatchingMethodName || isMatchingAccessType) {
        // Exact match
        score += 3;
      } else if (ruleValue === ACL.ALL) {
        // Wildcard match
        score += 2;
      } else if (requestedValue === ACL.ALL) {
        score += 1;
      } else {
        // Doesn't match at all
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
    switch (rule.principalType) {
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
        score += 1;
    }

    // Weigh against the roles
    // everyone < authenticated/unauthenticated < related < owner < ...
    score = score * 8;
    if (rule.principalType === ACL.ROLE) {
      switch (rule.principalId) {
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
  };

  /*!
   * Resolve permission from the ACLs
   * @param {Object[]) acls The list of ACLs
   * @param {Object} req The request
   * @returns {AccessRequest} result The effective ACL
   */
  ACL.resolvePermission = function resolvePermission(acls, req) {
    if (!(req instanceof AccessRequest)) {
      req = new AccessRequest(req);
    }
    // Sort by the matching score in descending order
    acls = acls.sort(function(rule1, rule2) {
      return ACL.getMatchingScore(rule2, req) - ACL.getMatchingScore(rule1, req);
    });
    var permission = ACL.DEFAULT;
    var score = 0;

    for (var i = 0; i < acls.length; i++) {
      var candidate = acls[i];
      score = ACL.getMatchingScore(candidate, req);
      if (score < 0) {
        // the highest scored ACL did not match
        break;
      }
      if (!req.isWildcard()) {
        // We should stop from the first match for non-wildcard
        permission = candidate.permission;
        break;
      } else {
        if (req.exactlyMatches(candidate)) {
          permission = candidate.permission;
          break;
        }
        // For wildcard match, find the strongest permission
        var candidateOrder = AccessContext.permissionOrder[candidate.permission];
        var permissionOrder = AccessContext.permissionOrder[permission];
        if (candidateOrder > permissionOrder) {
          permission = candidate.permission;
        }
      }
    }

    if (debug.enabled) {
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
    var modelClass = this.registry.findModel(model);
    var staticACLs = [];
    if (modelClass && modelClass.settings.acls) {
      modelClass.settings.acls.forEach(function(acl) {
        var prop = acl.property;
        // We support static ACL property with array of string values.
        if (Array.isArray(prop) && prop.indexOf(property) >= 0)
          prop = property;
        if (!prop || prop === ACL.ALL || property === prop) {
          staticACLs.push(new ACL({
            model: model,
            property: prop || ACL.ALL,
            principalType: acl.principalType,
            principalId: acl.principalId, // TODO: Should it be a name?
            accessType: acl.accessType || ACL.ALL,
            permission: acl.permission,
          }));
        }
      });
    }
    var prop = modelClass && (
      // regular property
      modelClass.definition.properties[property] ||
      // relation/scope
      (modelClass._scopeMeta && modelClass._scopeMeta[property]) ||
      // static method
      modelClass[property] ||
      // prototype method
      modelClass.prototype[property]);
    if (prop && prop.acls) {
      prop.acls.forEach(function(acl) {
        staticACLs.push(new ACL({
          model: modelClass.modelName,
          property: property,
          principalType: acl.principalType,
          principalId: acl.principalId,
          accessType: acl.accessType,
          permission: acl.permission,
        }));
      });
    }
    return staticACLs;
  };

  /**
   * Check if the given principal is allowed to access the model/property
   * @param {String} principalType The principal type.
   * @param {String} principalId The principal ID.
   * @param {String} model The model name.
   * @param {String} property The property/method/relation name.
   * @param {String} accessType The access type.
   * @callback {Function} callback Callback function.
   * @param {String|Error} err The error object
   * @param {AccessRequest} result The access permission
   */
  ACL.checkPermission = function checkPermission(principalType, principalId,
                                                 model, property, accessType,
                                                 callback) {
    if (principalId !== null && principalId !== undefined && (typeof principalId !== 'string')) {
      principalId = principalId.toString();
    }
    property = property || ACL.ALL;
    var propertyQuery = (property === ACL.ALL) ? undefined : {inq: [property, ACL.ALL]};
    accessType = accessType || ACL.ALL;
    var accessTypeQuery = (accessType === ACL.ALL) ? undefined :
      {inq: [accessType, ACL.ALL, ACL.EXECUTE]};

    var req = new AccessRequest(model, property, accessType);

    var acls = this.getStaticACLs(model, property);

    var resolved = this.resolvePermission(acls, req);

    if (resolved && resolved.permission === ACL.DENY) {
      debug('Permission denied by statically resolved permission');
      debug(' Resolved Permission: %j', resolved);
      process.nextTick(function() {
        if (callback) callback(null, resolved);
      });
      return;
    }

    var self = this;
    this.find({where: {principalType: principalType, principalId: principalId,
        model: model, property: propertyQuery, accessType: accessTypeQuery}},
      function(err, dynACLs) {
        if (err) {
          if (callback) callback(err);
          return;
        }
        acls = acls.concat(dynACLs);
        resolved = self.resolvePermission(acls, req);
        if (resolved && resolved.permission === ACL.DEFAULT) {
          var modelClass = self.registry.findModel(model);
          resolved.permission = (modelClass && modelClass.settings.defaultPermission) || ACL.ALLOW;
        }
        if (callback) callback(null, resolved);
      });
  };

  ACL.prototype.debug = function() {
    if (debug.enabled) {
      debug('---ACL---');
      debug('model %s', this.model);
      debug('property %s', this.property);
      debug('principalType %s', this.principalType);
      debug('principalId %s', this.principalId);
      debug('accessType %s', this.accessType);
      debug('permission %s', this.permission);
    }
  };

  /**
   * Check if the request has the permission to access.
   * @options {Object} context See below.
   * @property {Object[]} principals An array of principals.
   * @property {String|Model} model The model name or model class.
   * @property {*} id The model instance ID.
   * @property {String} property The property/method/relation name.
   * @property {String} accessType The access type:
   *   READ, REPLICATE, WRITE, or EXECUTE.
   * @param {Function} callback Callback function
   */

  ACL.checkAccessForContext = function(context, callback) {
    var self = this;
    self.resolveRelatedModels();
    var roleModel = self.roleModel;

    if (!(context instanceof AccessContext)) {
      context = new AccessContext(context);
    }

    var model = context.model;
    var property = context.property;
    var accessType = context.accessType;
    var modelName = context.modelName;

    var methodNames = context.methodNames;
    var propertyQuery = (property === ACL.ALL) ? undefined : {inq: methodNames.concat([ACL.ALL])};

    var accessTypeQuery = (accessType === ACL.ALL) ?
      undefined :
      (accessType === ACL.REPLICATE) ?
        {inq: [ACL.REPLICATE, ACL.WRITE, ACL.ALL]} :
        {inq: [accessType, ACL.ALL]};

    var req = new AccessRequest(modelName, property, accessType, ACL.DEFAULT, methodNames);

    var effectiveACLs = [];
    var staticACLs = self.getStaticACLs(model.modelName, property);

    this.find({where: {model: model.modelName, property: propertyQuery,
      accessType: accessTypeQuery}}, function(err, acls) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      var inRoleTasks = [];

      acls = acls.concat(staticACLs);

      acls.forEach(function(acl) {
        // Check exact matches
        for (var i = 0; i < context.principals.length; i++) {
          var p = context.principals[i];
          var typeMatch = p.type === acl.principalType;
          var idMatch = String(p.id) === String(acl.principalId);
          if (typeMatch && idMatch) {
            effectiveACLs.push(acl);
            return;
          }
        }

        // Check role matches
        if (acl.principalType === ACL.ROLE) {
          inRoleTasks.push(function(done) {
            roleModel.isInRole(acl.principalId, context,
              function(err, inRole) {
                if (!err && inRole) {
                  effectiveACLs.push(acl);
                }
                done(err, acl);
              });
          });
        }
      });

      async.parallel(inRoleTasks, function(err, results) {
        if (err) {
          if (callback) callback(err, null);
          return;
        }

        var resolved = self.resolvePermission(effectiveACLs, req);
        if (resolved && resolved.permission === ACL.DEFAULT) {
          resolved.permission = (model && model.settings.defaultPermission) || ACL.ALLOW;
        }
        debug('---Resolved---');
        resolved.debug();
        if (callback) callback(null, resolved);
      });
    });
  };

  /**
   * Check if the given access token can invoke the method
   * @param {AccessToken} token The access token
   * @param {String} model The model name
   * @param {*} modelId The model id
   * @param {String} method The method name
   * @callback {Function} callback Callback function
   * @param {String|Error} err The error object
   * @param {Boolean} allowed is the request allowed
   */
  ACL.checkAccessForToken = function(token, model, modelId, method, callback) {
    assert(token, 'Access token is required');

    var context = new AccessContext({
      accessToken: token,
      model: model,
      property: method,
      method: method,
      modelId: modelId,
    });

    this.checkAccessForContext(context, function(err, access) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      if (callback) callback(null, access.permission !== ACL.DENY);
    });
  };

  ACL.resolveRelatedModels = function() {
    if (!this.roleModel) {
      var reg = this.registry;
      this.roleModel = reg.getModelByType('Role');
      this.roleMappingModel = reg.getModelByType('RoleMapping');
      this.userModel = reg.getModelByType('User');
      this.applicationModel = reg.getModelByType('Application');
    }
  };

  /**
   * Resolve a principal by type/id
   * @param {String} type Principal type - ROLE/APP/USER
   * @param {String|Number} id Principal id or name
   * @param {Function} cb Callback function
   */
  ACL.resolvePrincipal = function(type, id, cb) {
    type = type || ACL.ROLE;
    this.resolveRelatedModels();
    switch (type) {
      case ACL.ROLE:
        this.roleModel.findOne({where: {or: [{name: id}, {id: id}]}}, cb);
        break;
      case ACL.USER:
        this.userModel.findOne(
          {where: {or: [{username: id}, {email: id}, {id: id}]}}, cb);
        break;
      case ACL.APP:
        this.applicationModel.findOne(
          {where: {or: [{name: id}, {email: id}, {id: id}]}}, cb);
        break;
      default:
        process.nextTick(function() {
          var err = new Error(g.f('Invalid principal type: %s', type));
          err.statusCode = 400;
          cb(err);
        });
    }
  };

  /**
   * Check if the given principal is mapped to the role
   * @param {String} principalType Principal type
   * @param {String|*} principalId Principal id/name
   * @param {String|*} role Role id/name
   * @param {Function} cb Callback function
   */
  ACL.isMappedToRole = function(principalType, principalId, role, cb) {
    var self = this;
    this.resolvePrincipal(principalType, principalId,
      function(err, principal) {
        if (err) return cb(err);
        if (principal != null) {
          principalId = principal.id;
        }
        principalType = principalType || 'ROLE';
        self.resolvePrincipal('ROLE', role, function(err, role) {
          if (err || !role) return cb(err, role);
          self.roleMappingModel.findOne({
            where: {
              roleId: role.id,
              principalType: principalType,
              principalId: String(principalId),
            },
          }, function(err, result) {
            if (err) return cb(err);
            return cb(null, !!result);
          });
        });
      });
  };
};
