// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var assert = require('assert');
var loopback = require('./loopback');
var debug = require('debug')('loopback:security:access-context');

const DEFAULT_SCOPES = ['DEFAULT'];

/**
 * Access context represents the context for a request to access protected
 * resources
 *
 * NOTE While the method expects an array of principals in the AccessContext instance/object,
 * it also accepts a single principal defined with the following properties:
 * ```js
 * {
 *   // AccessContext instance/object
 *   // ..
 *   principalType: 'somePrincipalType', // APP, ROLE, USER, or custom user model name
 *   principalId: 'somePrincipalId',
 * }
 * ```
 *
 * @class
 * @options {AccessContext|Object} context An AccessContext instance or an object
 * @property {Principal[]} principals An array of principals
 * @property {Function} model The model class
 * @property {String} modelName The model name
 * @property {*} modelId The model id
 * @property {String} property The model property/method/relation name
 * @property {String} method The model method to be invoked
 * @property {String} accessType The access type: READ, REPLICATE, WRITE, or EXECUTE.
 * @property {AccessToken} accessToken The access token resolved for the request
 * @property {RemotingContext} remotingContext The request's remoting context
 * @property {Registry} registry The application or global registry
 * @returns {AccessContext}
 * @constructor
 */
function AccessContext(context) {
  if (!(this instanceof AccessContext)) {
    return new AccessContext(context);
  }
  context = context || {};

  assert(context.registry,
    'Application registry is mandatory in AccessContext but missing in provided context');
  this.registry = context.registry;
  this.principals = context.principals || [];
  var model = context.model;
  model = ('string' === typeof model) ? this.registry.getModel(model) : model;
  this.model = model;
  this.modelName = model && model.modelName;

  this.modelId = context.id || context.modelId;
  this.property = context.property || AccessContext.ALL;

  this.method = context.method;
  this.sharedMethod = context.sharedMethod;
  this.sharedClass = this.sharedMethod && this.sharedMethod.sharedClass;
  if (this.sharedMethod) {
    this.methodNames = this.sharedMethod.aliases.concat([this.sharedMethod.name]);
  } else {
    this.methodNames = [];
  }

  if (this.sharedMethod) {
    this.accessType = this.model._getAccessTypeForMethod(this.sharedMethod);
  }

  this.accessType = context.accessType || AccessContext.ALL;

  assert(loopback.AccessToken,
    'AccessToken model must be defined before AccessContext model');
  this.accessToken = context.accessToken || loopback.AccessToken.ANONYMOUS;

  var principalType = context.principalType || Principal.USER;
  var principalId = context.principalId || undefined;
  var principalName = context.principalName || undefined;

  if (principalId) {
    this.addPrincipal(principalType, principalId, principalName);
  }

  var token = this.accessToken || {};

  if (token.userId) {
    this.addPrincipal(Principal.USER, token.userId);
  }
  if (token.appId) {
    this.addPrincipal(Principal.APPLICATION, token.appId);
  }
  this.remotingContext = context.remotingContext;
}

// Define constant for the wildcard
AccessContext.ALL = '*';

// Define constants for access types
AccessContext.READ = 'READ'; // Read operation
AccessContext.REPLICATE = 'REPLICATE'; // Replicate (pull) changes
AccessContext.WRITE = 'WRITE'; // Write operation
AccessContext.EXECUTE = 'EXECUTE'; // Execute operation

AccessContext.DEFAULT = 'DEFAULT'; // Not specified
AccessContext.ALLOW = 'ALLOW'; // Allow
AccessContext.ALARM = 'ALARM'; // Warn - send an alarm
AccessContext.AUDIT = 'AUDIT'; // Audit - record the access
AccessContext.DENY = 'DENY'; // Deny

AccessContext.permissionOrder = {
  DEFAULT: 0,
  ALLOW: 1,
  ALARM: 2,
  AUDIT: 3,
  DENY: 4,
};

/**
 * Add a principal to the context
 * @param {String} principalType The principal type
 * @param {*} principalId The principal id
 * @param {String} [principalName] The principal name
 * @returns {boolean}
 */
AccessContext.prototype.addPrincipal = function(principalType, principalId, principalName) {
  var principal = new Principal(principalType, principalId, principalName);
  for (var i = 0; i < this.principals.length; i++) {
    var p = this.principals[i];
    if (p.equals(principal)) {
      return false;
    }
  }
  this.principals.push(principal);
  return true;
};

/**
 * Get the user id
 * @returns {*}
 */
AccessContext.prototype.getUserId = function() {
  var user = this.getUser();
  return user && user.id;
};

/**
 * Get the user
 * @returns {*}
 */
AccessContext.prototype.getUser = function() {
  var BaseUser = this.registry.getModel('User');
  for (var i = 0; i < this.principals.length; i++) {
    var p = this.principals[i];
    var isBuiltinPrincipal = p.type === Principal.APP ||
      p.type === Principal.ROLE ||
      p.type == Principal.SCOPE;
    if (isBuiltinPrincipal) continue;

    // the principalType must either be 'USER'
    if (p.type === Principal.USER) {
      return {id: p.id, principalType: p.type};
    }

    // or permit to resolve a valid user model
    var userModel = this.registry.findModel(p.type);
    if (!userModel) continue;
    if (userModel.prototype instanceof BaseUser) {
      return {id: p.id, principalType: p.type};
    }
  }
};

/**
 * Get the application id
 * @returns {*}
 */
AccessContext.prototype.getAppId = function() {
  for (var i = 0; i < this.principals.length; i++) {
    var p = this.principals[i];
    if (p.type === Principal.APPLICATION) {
      return p.id;
    }
  }
  return null;
};

/**
 * Check if the access context has authenticated principals
 * @returns {boolean}
 */
AccessContext.prototype.isAuthenticated = function() {
  return !!(this.getUserId() || this.getAppId());
};

/**
 * Get the list of scopes required by the current access context.
 */
AccessContext.prototype.getScopes = function() {
  if (!this.sharedMethod)
    return DEFAULT_SCOPES;

  // For backwards compatibility, methods with no scopes defined
  // are assigned a single "DEFAULT" scope
  const methodLevel = this.sharedMethod.accessScopes || DEFAULT_SCOPES;

  // TODO add model-level and app-level scopes

  debug('--Context scopes of %s()--', this.sharedMethod.stringName);
  debug('  method-level: %j', methodLevel);

  return methodLevel;
};

/**
 * Check if the scope required by the remote method is allowed
 * by the scopes granted to the requesting access token.
 * @return {boolean}
 */
AccessContext.prototype.isScopeAllowed = function() {
  if (!this.accessToken) return false;

  // For backwards compatibility, tokens with no scopes are treated
  // as if they have "DEFAULT" scope granted
  const tokenScopes = this.accessToken.scopes || DEFAULT_SCOPES;

  const resourceScopes = this.getScopes();

  // Scope is allowed when at least one of token's scopes
  // is found in method's (resource's) scopes.
  return Array.isArray(tokenScopes) && Array.isArray(resourceScopes) &&
    resourceScopes.some(s => tokenScopes.indexOf(s) !== -1);
};

/*!
 * Print debug info for access context.
 */

AccessContext.prototype.debug = function() {
  if (debug.enabled) {
    debug('---AccessContext---');
    if (this.principals && this.principals.length) {
      debug('principals:');
      this.principals.forEach(function(principal) {
        debug('principal: %j', principal);
      });
    } else {
      debug('principals: %j', this.principals);
    }
    debug('modelName %s', this.modelName);
    debug('modelId %s', this.modelId);
    debug('property %s', this.property);
    debug('method %s', this.method);
    debug('accessType %s', this.accessType);
    debug('accessScopes %j', this.getScopes());
    if (this.accessToken) {
      debug('accessToken:');
      debug('  id %j', this.accessToken.id);
      debug('  ttl %j', this.accessToken.ttl);
      debug('  scopes %j', this.accessToken.scopes || DEFAULT_SCOPES);
    }
    debug('getUserId() %s', this.getUserId());
    debug('isAuthenticated() %s', this.isAuthenticated());
  }
};

/**
 * This class represents the abstract notion of a principal, which can be used
 * to represent any entity, such as an individual, a corporation, and a login id
 * @param {String} type The principal type
 * @param {*} id The principal id
 * @param {String} [name] The principal name
 * @param {String} modelName The principal model name
 * @returns {Principal}
 * @class
 */
function Principal(type, id, name) {
  if (!(this instanceof Principal)) {
    return new Principal(type, id, name);
  }
  this.type = type;
  this.id = id;
  this.name = name;
}

// Define constants for principal types
Principal.USER = 'USER';
Principal.APP = Principal.APPLICATION = 'APP';
Principal.ROLE = 'ROLE';
Principal.SCOPE = 'SCOPE';

/**
 * Compare if two principals are equal
 * Returns true if argument principal is equal to this principal.
 * @param {Object} p The other principal
 */
Principal.prototype.equals = function(p) {
  if (p instanceof Principal) {
    return this.type === p.type && String(this.id) === String(p.id);
  }
  return false;
};

/**
 * A request to access protected resources.
 *
 * The method can either be called with the following signature or with a single
 * argument: an AccessRequest instance or an object containing all the required properties.
 *
 * @class
 * @options {String|AccessRequest|Object} model|req The model name,<br>
 *    or an AccessRequest instance/object.
 * @param {String} property The property/method/relation name
 * @param {String} accessType The access type
 * @param {String} permission The requested permission
 * @param {String[]} methodNames The names of involved methods
 * @param {Registry} registry The application or global registry
 * @returns {AccessRequest}
 */
function AccessRequest(model, property, accessType, permission, methodNames, registry) {
  if (!(this instanceof AccessRequest)) {
    return new AccessRequest(model, property, accessType, permission, methodNames);
  }
  if (arguments.length === 1 && typeof model === 'object') {
    // The argument is an object that contains all required properties
    var obj = model || {};
    this.model = obj.model || AccessContext.ALL;
    this.property = obj.property || AccessContext.ALL;
    this.accessType = obj.accessType || AccessContext.ALL;
    this.permission = obj.permission || AccessContext.DEFAULT;
    this.methodNames = obj.methodNames || [];
    this.registry = obj.registry;
  } else {
    this.model = model || AccessContext.ALL;
    this.property = property || AccessContext.ALL;
    this.accessType = accessType || AccessContext.ALL;
    this.permission = permission || AccessContext.DEFAULT;
    this.methodNames = methodNames || [];
    this.registry = registry;
  }
  // do not create AccessRequest without a registry
  assert(this.registry,
    'Application registry is mandatory in AccessRequest but missing in provided argument(s)');
}

/**
 * Does the request contain any wildcards?
 *
 * @returns {Boolean}
 */
AccessRequest.prototype.isWildcard = function() {
  return this.model === AccessContext.ALL ||
    this.property === AccessContext.ALL ||
    this.accessType === AccessContext.ALL;
};

/**
 * Does the given `ACL` apply to this `AccessRequest`.
 *
 * @param {ACL} acl
 */

AccessRequest.prototype.exactlyMatches = function(acl) {
  var matchesModel = acl.model === this.model;
  var matchesProperty = acl.property === this.property;
  var matchesMethodName = this.methodNames.indexOf(acl.property) !== -1;
  var matchesAccessType = acl.accessType === this.accessType;

  if (matchesModel && matchesAccessType) {
    return matchesProperty || matchesMethodName;
  }

  return false;
};

/**
 * Settle the accessRequest's permission if DEFAULT
 * In most situations, the default permission can be resolved from the nested model
 * config. An default permission can also be explicitly provided to override it or
 * cope with AccessRequest instances without a nested model (e.g. model is '*')
 *
 * @param {String} defaultPermission (optional) the default permission to apply
 */

AccessRequest.prototype.settleDefaultPermission = function(defaultPermission) {
  if (this.permission !== 'DEFAULT')
    return;

  var modelName = this.model;
  if (!defaultPermission) {
    var modelClass = this.registry.findModel(modelName);
    defaultPermission = modelClass && modelClass.settings.defaultPermission;
  }

  this.permission = defaultPermission || 'ALLOW';
};

/**
 * Is the request for access allowed?
 *
 * @returns {Boolean}
 */

AccessRequest.prototype.isAllowed = function() {
  return this.permission !== loopback.ACL.DENY;
};

AccessRequest.prototype.debug = function() {
  if (debug.enabled) {
    debug('---AccessRequest---');
    debug(' model %s', this.model);
    debug(' property %s', this.property);
    debug(' accessType %s', this.accessType);
    debug(' permission %s', this.permission);
    debug(' isWildcard() %s', this.isWildcard());
    debug(' isAllowed() %s', this.isAllowed());
  }
};

module.exports.AccessContext = AccessContext;
module.exports.Principal = Principal;
module.exports.AccessRequest = AccessRequest;
module.exports.DEFAULT_SCOPES = DEFAULT_SCOPES;
