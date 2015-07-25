/*!
 * Module dependencies.
 */
var async = require('async');
var pathToRegExp = require('path-to-regexp');
var debug = require('debug')('loopback:security:acl:route');
var loopback = require('../../lib/loopback');
var Principal = require('../../lib/access-context').Principal;
var Role;
var ACL;

/*!
 * Export the middleware.
 */

module.exports = acl;

/**
 * Normalize the http verb to lower case
 * @param {String} verb HTTP verb/method
 * @returns {String|*}
 */
function normalizeVerb(verb) {
  verb = verb.toLowerCase();
  if (verb === 'del') {
    verb = 'delete';
  }
  return verb;
}

/**
 * Normalize items to string[]
 * @param {String|String[]} items
 * @returns {String[]}
 */
function normalizeList(items) {
  if (!items) {
    return [];
  }
  var list;
  if (Array.isArray(items)) {
    list = [].concat(items);
  } else if (typeof items === 'string') {
    list = items.split(/[\s,]+/g).filter(Boolean);
  } else {
    throw new Error('Invalid items: ' + items);
  }
  return list;
}

function toLowerCase(m) {
  return m && m.toLowerCase();
}

/**
 * Normalize the scopes object into an array of routes sorted by its
 * path/methods
 *
 * ```json
 * {
 *   "scope1": [{"methods": "get", path: "/:user/profile"}, "/order"],
 *   "scope2": [{"methods": "post", path: "/:user/profile"}]
 * }
 * ```
 *
 * @param {Object} scopes Scope mappings
 * @returns {Array}
 */
function normalizeScopeMappings(scopes) {
  var routes = [];
  for (var s in scopes) {
    var routeList = scopes[s];
    debug('Scope: %s, routes: %j', s, routeList);
    if (Array.isArray(routeList)) {
      for (var i = 0, n = routeList.length; i < n; i++) {
        var route = routeList[i];
        var methods = normalizeList(route.methods);
        if (methods.length === 0) {
          methods = ['all'];
        }
        methods = methods.map(normalizeVerb);
        var routeDef = {
          scope: s,
          methods: methods,
          path: route.path,
          regexp: pathToRegExp(route.path, [], {end: false})
        };
        debug('Route: %j', routeDef);
        routes.push(routeDef);
      }
    }
  }
  routes.sort(sortRoutes);
  return routes;
}

/**
 * Normalize and sort ACL entries
 * @param {Object[]} acls An array of ACLs
 * @returns {*|Array}
 */
function normalizeACLs(acls) {
  acls = acls || [];
  for (var i = 0, n = acls.length; i < n; i++) {
    var acl = acls[i];
    if (acl.role) {
      acl.principalType = Principal.ROLE;
      acl.principalId = acl.role;
      delete acl.role;
    }
    acl.scopes = normalizeList(acl.scopes);
  }
  acls.sort(sortACLs);
  return acls;
}
/**
 * Find matching ACLs for the given scopes
 * @param {Object[]} acls An array of acl entries
 * @param {Object[]} scopes An array of scopes
 * @returns {Object[]} ACLs matching one of the scopes
 */
function matchACLs(acls, scopes) {
  var matchedACLs = [];
  if (Array.isArray(scopes) && Array.isArray(acls)) {
    for (var i = 0, n = scopes.length; i < n; i++) {
      var s = scopes[i];
      for (var j = 0, k = acls.length; j < k; j++) {
        var acl = acls[j];
        debug('Checking ACL %j against scope %s', acl, s);
        var aclScopes = acl.scopes || [];
        if (typeof aclScopes === 'string') {
          aclScopes = normalizeList(aclScopes);
        }
        if (aclScopes.indexOf(s) !== -1) {
          debug('Matched ACL for scope: %j', s, acl);
          matchedACLs.push(acl);
        }
      }
    }
  }
  return matchedACLs;
}

/**
 * Try to find out the protected resource scopes for the given request
 * @param {Request} req loopback Request
 * @param {Function} cb Callback function
 * @returns {*}
 */
function identifyScopes(req, scopes, cb) {
  var routes = normalizeScopeMappings(scopes);
  var matchedScopes = findMatchedScopes(req, routes);
  debug('Matched scopes: %j', matchedScopes);
  return process.nextTick(function() {
    cb(null, matchedScopes);
  });
}

/**
 * Try to find out the principals for the given request
 * @param {Request} req HTTP request object
 */
function identifyPrincipals(req) {
  var principals = [{
    principalType: Principal.ROLE,
    principalId: '$everyone'
  }];
  if (req.accessToken) {
    if (req.accessToken.userId != null) {
      principals.push({
        principalType: Principal.USER,
        principalId: req.accessToken.userId
      });
      principals.push({
        principalType: Principal.ROLE,
        principalId: '$authenticated'
      });
    }
    var appId = req.accessToken.appId || req.accessToken.clientId;
    if (appId != null) {
      principals.push({
        principalType: Principal.APP,
        principalId: appId
      });
    }
  } else {
    principals.push({
      principalType: Principal.ROLE,
      principalId: '$unauthenticated'
    });
  }
  debug('Principals: %j', principals);
  return principals;
}

/**
 * Find matched scopes for the given routes
 * @param {Request} req HTTP request object
 * @param {Object[]} routes An array of routes (methods, path)
 * @returns {Array} Scopes matching the request
 */
function findMatchedScopes(req, routes) {
  var matchedScopes = [];
  var method = req.method.toLowerCase();
  var url = req.originalUrl || req.url;

  for (var i = 0, n = routes.length; i < n; i++) {
    var route = routes[i];
    debug('Matching %s %s against %j', method, url, route);
    if (route.methods.indexOf('all') !== -1 ||
      route.methods.indexOf(method) !== -1) {
      debug('url: %s, regexp: %s', url, route.regexp);
      var index = url.indexOf('?');
      if (index !== -1) {
        url = url.substring(0, index);
      }
      if (route.regexp.test(url)) {
        matchedScopes.push(route.scope);
      }
    }
  }
  return matchedScopes;
}

/**
 * Calculate the ACL score based its specifics of principalType and permission
 * @param {Object} acl ACL rule
 * @returns {number}
 */
function getACLScore(acl) {
  var score = 0;
  switch (acl.principalType) {
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
  score = score * 8;
  if (acl.principalType === ACL.ROLE) {
    switch (acl.principalId) {
      case Role.AUTHENTICATED:
      case Role.UNAUTHENTICATED:
        score += 2;
        break;
      case Role.EVERYONE:
        score += 1;
        break;
      default:
        score += 3;
    }
  }
  score = score * 8;
  switch (acl.permission) {
    case ACL.ALLOW:
      score += 1;
      break;
    case ACL.ALARM:
      score += 2;
      break;
    case ACL.AUDIT:
      score += 3;
      break;
    case ACL.DENY:
      score += 4;
      break;
  }
  return score;
}

function sortACLs(acl1, acl2) {
  // Descending order of scores
  var b = getACLScore(acl1);
  var a = getACLScore(acl2);
  return a === b ? 0 : (a > b ? 1 : -1);
}

/*!
 * Compare two routes
 * @param {Object} a The first route {verb: 'get', path: '/:id'}
 * @param [Object} b The second route {verb: 'get', path: '/findOne'}
 * @returns {number} 1: r1 comes after 2, -1: r1 comes before r2, 0: equal
 */
function sortRoutes(a, b) {

  var methods1 = normalizeList(a.methods).map(toLowerCase).sort().join(',');
  var methods2 = normalizeList(b.methods).map(toLowerCase).sort().join(',');

  // Normalize the verbs
  var verb1 = methods1;
  var verb2 = methods2;

  // Sort by path part by part using the / delimiter
  // For example '/:id' will become ['', ':id'], '/findOne' will become
  // ['', 'findOne']
  var p1 = a.path.split('/');
  var p2 = b.path.split('/');
  var len = Math.min(p1.length, p2.length);

  // Loop through the parts and decide which path should come first
  for (var i = 0; i < len; i++) {
    // Empty part has lower weight
    if (p1[i] === '' && p2[i] !== '') {
      return 1;
    } else if (p1[i] !== '' && p2[i] === '') {
      return -1;
    }
    // Wildcard has lower weight
    if (p1[i][0] === ':' && p2[i][0] !== ':') {
      return 1;
    } else if (p1[i][0] !== ':' && p2[i][0] === ':') {
      return -1;
    }
    // Now the regular string comparision
    if (p1[i] > p2[i]) {
      return 1;
    } else if (p1[i] < p2[i]) {
      return -1;
    }
  }
  // Both paths have the common parts. The longer one should come before the
  // shorter one
  if (p1.length === p2.length) {
    // First sort by verb
    if (verb1 > verb2) {
      return -1;
    } else if (verb1 < verb2) {
      return 1;
    }
  } else {
    return p2.length > p1.length ? 1 : -1;
  }
}

/**
 * Check the http request against route based ACLs
 *
 * ```js
 * app.use(loopback.acl(
 * {
 * scopes: {
 *   "catalog": [{
 *     "methods": "GET",
 *     "path": "/api/catalog"
 *   }],
 *   "order": [{
 *     "methods": "ALL",
 *     "path": "/api/orders"
 *   }],
 *   "cancelOrder": [{
 *     "methods": "delete",
 *     "path": "/api/orders/:id"
 *   }],
 *   "deleteEntities": [
 *     {
 *       "methods": ["delete"],
 *       "path": "/api/:model"
 *     }
 *   ]
 * },
 * acls: [
 *   {
 *     role: '$everyone',
 *     scopes: ['catalog'],
 *     permission: 'ALLOW'
 *   },
 *   {
 *     role: '$unauthenticated',
 *     scopes: ['order'],
 *     permission: 'DENY'
 *   },
 *   {
 *     role: '$everyone',
 *     scopes: ['deleteEntities'],
 *     permission: 'DENY'
 *   },
 *   {
 *     principalType: 'ROLE',
 *     principalId: 'admin',
 *     scopes: ['deleteEntities'],
 *     permission: 'ALLOW'
 *   },
 *   {
 *     principalType: 'ROLE',
 *     principalId: 'cs',
 *     scopes: ['cancelOrder'],
 *     permission: 'ALLOW'
 *   }
 * ],
 * roles: {
 *   admin: [
 *     {principalType: 'USER', principalId: 'mary'}
 *   ],
 *   demo: [
 *     {principalType: 'USER', principalId: 'john'},
 *     {principalType: 'APP', principalId: 'demo-app'}]
 * }
 * ));
 * ```
 *
 * @options {Object} [options]
 * @property {Object} [scopes] Object of scope mappings.
 * @property {Array} [acls] Array of ACLs.
 * @property {Array} [roles] Object of Role mappings.
 * @property {Boolean} [ignoreACLsFromDB] Ignore ACLs from databases
 * @property {Function} [identifyScopes] A custom function to identify scopes
 * from the http request
 * @property {Function} [hasPrincipal] A custom function to check if a http
 * request matches the given principal
 * @header loopback.acl([options])
 */
function acl(options) {
  options = options || {};

  var scopes = options.scopes;
  var acls = options.acls;
  var roles = options.roles || {};

  var registry;
  var aclModel;

  Role = loopback.Role;
  ACL = loopback.ACL;

  return function(req, res, next) {
    if (!(options.scopes || options.acls ||
      options.checkACLs || options.identifyScopes)) {
      return next();
    }

    if (!registry) {
      // Get the registry
      if (req.app) {
        registry = req.app.registry;
      } else {
        registry = loopback.registry;
      }
      aclModel = registry.getModelByType(loopback.ACL);
    }

    var identifyScopesFunc = identifyScopes;
    if (typeof options.identifyScopes === 'function') {
      identifyScopesFunc = options.identifyScopes;
    }

    var hasPrincipalFunc;
    if (typeof options.hasPrincipal === 'function') {
      hasPrincipalFunc = options.hasPrincipal;
    } else {
      // List principals from the req
      var principals = identifyPrincipals(req);
      hasPrincipalFunc = function(req, principalType, principalId, cb) {
        principalType = principalType || Principal.ROLE;
        for (var i = 0, n = principals.length; i < n; i++) {
          if (principals[i].principalType === principalType &&
            principals[i].principalId == principalId) {
            debug('Principal %s:%s found for role %s',
              principals[i].principalType, principals[i].principalId, role);
            return cb(null, true);
          }
        }

        if (principalType === Principal.ROLE) {
          // Check the roles definitions
          var appId = req.accessToken && req.accessToken.appId;
          var userId = req.accessToken && req.accessToken.userId;
          if (appId == null && userId == null) return cb(null, false);
          var role = principalId;
          var principalsInRole = roles[role];
          if (Array.isArray(principalsInRole)) {
            for (i = 0, n = principalsInRole.length; i < n; i++) {
              if ((principalsInRole[i].principalType === Principal.APP &&
                principalsInRole[i].principalId == appId) ||
                (principalsInRole[i].principalType === Principal.USER &&
                principalsInRole[i].principalId == userId)) {
                debug('Principal %s:%s found for role %s',
                  principalsInRole[i].principalType,
                  principalsInRole[i].principalId, role);
                return cb(null, true);
              }
            }
          }
          if (!options.ignoreACLsFromDB) {
            // Checks the roleMapping model
            aclModel.isMappedToRole(Principal.USER, userId, role, function(err, yes) {
              if (err) return cb(err);
              if (yes) return cb(null, true);
              aclModel.isMappedToRole(Principal.APP, appId, role, function(err, yes) {
                cb(err, yes);
              });
            });
          }
        } else {
          return cb(null, false);
        }
      };
    }

    function checkACLs(req, scopes, cb) {
      acls = normalizeACLs(acls);
      var matchedACLs = matchACLs(acls, scopes);

      var error;
      async.detectSeries(matchedACLs, function(acl, done) {
        hasPrincipalFunc(req, acl.principalType, acl.principalId,
          function(err, yes) {
            if (err) {
              error = err;
              return done(true);
            }
            if (!yes) return done(false); // Continue
            if (acl.permission === 'ALLOW') {
              debug('Request is allowed by ACL: %j', acl);
              return done(true);
            } else {
              error = new Error('Authorization failed');
              error.statusCode = 403;
              debug('Request is denied by ACL: %j', acl);
              return done(true);
            }
          });
      }, function(result) {
        cb(error, result);
      });
    }

    var checkACLsFunc = checkACLs;
    if (typeof options.checkACLs === 'function') {
      checkACLsFunc = options.checkACLs;
    }

    identifyScopesFunc(req, scopes, function(err, matchedScopes) {
      if (err) return next(err);
      checkACLsFunc(req, matchedScopes, next);
    });
  };
}
