var loopback = require('../loopback');
var AccessToken = require('./access-token');
var debug = require('debug')('loopback:security:access-context');

/**
 * Access context represents the context for a request to access protected
 * resources
 *
 * @class
 * @options {Object} context The context object
 * @property {Principal[]} principals An array of principals
 * @property {Function} model The model class
 * @property {String} modelName The model name
 * @property {String} modelId The model id
 * @property {String} property The model property/method/relation name
 * @property {String} method The model method to be invoked
 * @property {String} accessType The access type
 * @property {AccessToken} accessToken The access token
 *
 * @returns {AccessContext}
 * @constructor
 */
function AccessContext(context) {
  if (!(this instanceof AccessContext)) {
    return new AccessContext(context);
  }
  context = context || {};

  this.principals = context.principals || [];
  var model = context.model;
  model = ('string' === typeof model) ? loopback.getModel(model) : model;
  this.model = model;
  this.modelName = model && model.modelName;

  this.modelId = context.id || context.modelId;
  this.property = context.property || AccessContext.ALL;

  this.method = context.method;
  this.sharedMethod = context.sharedMethod;
  this.sharedClass = this.sharedMethod && this.sharedMethod.sharedClass;
  if(this.sharedMethod) {
    this.methodNames = this.sharedMethod.aliases.concat([this.sharedMethod.name]);  
  } else {
    this.methodNames = [];
  }
  
  if(this.sharedMethod) {
    this.accessType = this.model._getAccessTypeForMethod(this.sharedMethod);  
  }
  
  this.accessType = context.accessType || AccessContext.ALL;
  this.accessToken = context.accessToken || AccessToken.ANONYMOUS;

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
}

// Define constant for the wildcard
AccessContext.ALL = '*';

// Define constants for access types
AccessContext.READ = 'READ'; // Read operation
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
  DENY: 4
};

/**
 * Add a principal to the context
 * @param {String} principalType The principal type
 * @param {*} principalId The principal id
 * @param {String} [principalName] The principal name
 * @returns {boolean}
 */
AccessContext.prototype.addPrincipal = function (principalType, principalId, principalName) {
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
  for (var i = 0; i < this.principals.length; i++) {
    var p = this.principals[i];
    if (p.type === Principal.USER) {
      return p.id;
    }
  }
  return null;
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
 * Print debug info for access context.
 */

AccessContext.prototype.debug = function() {
  if(debug.enabled) {
    debug('---AccessContext---');
    if(this.principals && this.principals.length) {
      debug('principals:')
      this.principals.forEach(function(principal) {
        debug('principal: %j', principal)
      });
    } else {
      debug('principals: %j', this.principals);
    }
    debug('modelName %s', this.modelName);
    debug('modelId %s', this.modelId);
    debug('property %s', this.property);
    debug('method %s', this.method);
    debug('accessType %s', this.accessType);
    if(this.accessToken) {
      debug('accessToken:')
      debug('  id %j', this.accessToken.id);
      debug('  ttl %j', this.accessToken.ttl);
    }
    debug('getUserId() %s', this.getUserId());
    debug('isAuthenticated() %s', this.isAuthenticated());
  }
}

/**
 * This class represents the abstract notion of a principal, which can be used
 * to represent any entity, such as an individual, a corporation, and a login id
 * @param {String} type The principal type
 * @param {*} id The princiapl id
 * @param {String} [name] The principal name
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
 * @param {Object} principal The other principal
 */
Principal.prototype.equals = function (p) {
  if (p instanceof Principal) {
    return this.type === p.type && String(this.id) === String(p.id);
  }
  return false;
};

/**
 * A request to access protected resources.
 * @param {String} model The model name
 * @param {String} property
 * @param {String} accessType The access type
 * @param {String} permission The requested permission
 * @returns {AccessRequest}
 * @class
 */
function AccessRequest(model, property, accessType, permission, methodNames) {
  if (!(this instanceof AccessRequest)) {
    return new AccessRequest(model, property, accessType);
  }
  if (arguments.length === 1 && typeof model === 'object') {
    // The argument is an object that contains all required properties
    var obj = model || {};
    this.model = obj.model || AccessContext.ALL;
    this.property = obj.property || AccessContext.ALL;
    this.accessType = obj.accessType || AccessContext.ALL;
    this.permission = obj.permission || AccessContext.DEFAULT;
    this.methodNames = methodNames || [];
  } else {
    this.model = model || AccessContext.ALL;
    this.property = property || AccessContext.ALL;
    this.accessType = accessType || AccessContext.ALL;
    this.permission = permission || AccessContext.DEFAULT;
    this.methodNames = methodNames || [];
  }
}

/**
 * Does the request contain any wildcards?
 *
 * @returns {Boolean}
 */
AccessRequest.prototype.isWildcard = function () {
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

  if(matchesModel && matchesAccessType) {
    return matchesProperty || matchesMethodName;
  }

  return false;
}

/**
 * Is the request for access allowed?
 * 
 * @returns {Boolean}
 */

AccessRequest.prototype.isAllowed = function() {
  return this.permission !== require('./acl').ACL.DENY;
}

AccessRequest.prototype.debug = function() {
  if(debug.enabled) {
    debug('---AccessRequest---');
    debug(' model %s', this.model);
    debug(' property %s', this.property);
    debug(' accessType %s', this.accessType);
    debug(' permission %s', this.permission);
    debug(' isWildcard() %s', this.isWildcard());
    debug(' isAllowed() %s', this.isAllowed());
  }
}

module.exports.AccessContext = AccessContext;
module.exports.Principal = Principal;
module.exports.AccessRequest = AccessRequest;



