var assert = require('assert');
var express = require('express');
var merge = require('util')._extend;
var mergePhaseNameLists = require('loopback-phase').mergePhaseNameLists;
var debug = require('debug')('loopback:app');
var stableSortInPlace = require('stable').inplace;

var BUILTIN_MIDDLEWARE = { builtin: true };

var proto = {};

module.exports = function loopbackExpress() {
  var app = express();
  app.__expressLazyRouter = app.lazyrouter;
  merge(app, proto);
  return app;
};

/**
 * Register a middleware using a factory function and a JSON config.
 *
 * **Example**
 *
 * ```js
 * app.middlewareFromConfig(compression, {
 *   enabled: true,
 *   phase: 'initial',
 *   params: {
 *     threshold: 128
 *   }
 * });
 * ```
 *
 * @param {function} factory The factory function creating a middleware handler.
 *   Typically a result of `require()` call, e.g. `require('compression')`.
 * @options {Object} config The configuration.
 * @property {String} phase The phase to register the middleware in.
 * @property {Boolean} [enabled] Whether the middleware is enabled.
 *   Default: `true`.
 * @property {Array|*} [params] The arguments to pass to the factory
 *   function. Either an array of arguments,
 *   or the value of the first argument when the factory expects
 *   a single argument only.
 * @property {Array|string|RegExp} [paths] Optional list of paths limiting
 *   the scope of the middleware.
 *
 * @returns {object} this (fluent API)
 *
 * @header app.middlewareFromConfig(factory, config)
 */
proto.middlewareFromConfig = function(factory, config) {
  assert(typeof factory === 'function', '"factory" must be a function');
  assert(typeof config === 'object', '"config" must be an object');
  assert(typeof config.phase === 'string' && config.phase,
    '"config.phase" must be a non-empty string');

  if (config.enabled === false)
    return;

  var params = config.params;
  if (params === undefined) {
    params = [];
  } else if (!Array.isArray(params)) {
    params = [params];
  }

  var handler = factory.apply(null, params);
  this.middleware(config.phase, config.paths || [], handler);

  return this;
};

/**
 * Register (new) middleware phases.
 *
 * If all names are new, then the phases are added just before "routes" phase.
 * Otherwise the provided list of names is merged with the existing phases
 * in such way that the order of phases is preserved.
 *
 * **Examples**
 *
 * ```js
 * // built-in phases:
 * // initial, session, auth, parse, routes, files, final
 *
 * app.defineMiddlewarePhases('custom');
 * // new list of phases
 * // initial, session, auth, parse, custom, routes, files, final
 *
 * app.defineMiddlewarePhases([
 *   'initial', 'postinit', 'preauth', 'routes', 'subapps'
 * ]);
 * // new list of phases
 * // initial, postinit, preauth, session, auth, parse, custom,
 * // routes, subapps, files, final
 * ```
 *
 * @param {string|Array.<string>} nameOrArray A phase name or a list of phase
 *   names to add.
 *
 * @returns {object} this (fluent API)
 *
 * @header app.defineMiddlewarePhases(nameOrArray)
 */
proto.defineMiddlewarePhases = function(nameOrArray) {
  this.lazyrouter();

  if (Array.isArray(nameOrArray)) {
    this._requestHandlingPhases =
      mergePhaseNameLists(this._requestHandlingPhases, nameOrArray);
  } else {
    // add the new phase before 'routes'
    var routesIx = this._requestHandlingPhases.indexOf('routes');
    this._requestHandlingPhases.splice(routesIx - 1, 0, nameOrArray);
  }

  return this;
};

/**
 * Register a middleware handler to be executed in a given phase.
 * @param {string} name The phase name, e.g. "init" or "routes".
 * @param {Array|string|RegExp} [paths] Optional list of paths limiting
 *   the scope of the middleware.
 *   String paths are interpreted as expressjs path patterns,
 *   regular expressions are used as-is.
 * @param {function} handler The middleware handler, one of
 *   `function(req, res, next)` or
 *   `function(err, req, res, next)`
 * @returns {object} this (fluent API)
 *
 * @header app.middleware(name, handler)
 */
proto.middleware = function(name, paths, handler) {
  this.lazyrouter();

  if (handler === undefined && typeof paths === 'function') {
    handler = paths;
    paths = undefined;
  }

  assert(typeof name === 'string' && name, '"name" must be a non-empty string');
  assert(typeof handler === 'function', '"handler" must be a function');

  if (paths === undefined) {
    paths = '/';
  }

  var fullPhaseName = name;
  var handlerName = handler.name || '<anonymous>';

  var m = name.match(/^(.+):(before|after)$/);
  if (m) {
    name = m[1];
  }

  if (this._requestHandlingPhases.indexOf(name) === -1)
    throw new Error('Unknown middleware phase ' + name);

  debug('use %s %s %s', fullPhaseName, paths, handlerName);

  this._skipLayerSorting = true;
  this.use(paths, handler);

  var layer = this._findLayerByHandler(handler);
  if (layer) {
    // Set the phase name for sorting
    layer.phase = fullPhaseName;
  } else {
    debug('No matching layer is found for %s %s', fullPhaseName, handlerName);
  }

  this._skipLayerSorting = false;

  this._sortLayersByPhase();

  return this;
};

/*!
 * Find the corresponding express layer by handler
 *
 * This is needed because monitoring agents such as NewRelic can add handlers
 * to the stack. For example, NewRelic adds sentinel handler. We need to search
 * the stackto find the correct layer.
 */
proto._findLayerByHandler = function(handler) {
  // Other handlers can be added to the stack, for example,
  // NewRelic adds sentinel handler. We need to search the stack
  for (var k = this._router.stack.length - 1; k >= 0; k--) {
    if (this._router.stack[k].handle === handler ||
      // NewRelic replaces the handle and keeps it as __NR_original
      this._router.stack[k].handle['__NR_original'] === handler
      ) {
      return this._router.stack[k];
    } else {
      // Aggressively check if the original handler has been wrapped
      // into a new function with a property pointing to the original handler
      for (var p in this._router.stack[k].handle) {
        if (this._router.stack[k].handle[p] === handler) {
          return this._router.stack[k];
        }
      }
    }
  }
  return null;
};

// Install our custom PhaseList-based handler into the app
proto.lazyrouter = function() {
  var self = this;
  if (self._router) return;

  self.__expressLazyRouter();

  var router = self._router;

  // Mark all middleware added by Router ctor as builtin
  // The sorting algo will keep them at beginning of the list
  router.stack.forEach(function(layer) {
    layer.phase = BUILTIN_MIDDLEWARE;
  });

  router.__expressUse = router.use;
  router.use = function useAndSort() {
    var retval = this.__expressUse.apply(this, arguments);
    self._sortLayersByPhase();
    return retval;
  };

  router.__expressRoute = router.route;
  router.route = function routeAndSort() {
    var retval = this.__expressRoute.apply(this, arguments);
    self._sortLayersByPhase();
    return retval;
  };

  self._requestHandlingPhases = [
    'initial', 'session', 'auth', 'parse',
    'routes', 'files', 'final'
  ];
};

proto._sortLayersByPhase = function() {
  if (this._skipLayerSorting) return;

  var phaseOrder = {};
  this._requestHandlingPhases.forEach(function(name, ix) {
    phaseOrder[name + ':before'] = ix * 3;
    phaseOrder[name] = ix * 3 + 1;
    phaseOrder[name + ':after'] = ix * 3 + 2;
  });

  var router = this._router;
  stableSortInPlace(router.stack, compareLayers);

  function compareLayers(left, right) {
    var leftPhase = left.phase;
    var rightPhase = right.phase;

    if (leftPhase === rightPhase) return 0;

    // Builtin middleware is always first
    if (leftPhase === BUILTIN_MIDDLEWARE) return -1;
    if (rightPhase === BUILTIN_MIDDLEWARE) return 1;

    // Layers registered via app.use and app.route
    // are executed as the first items in `routes` phase
    if (leftPhase === undefined) {
      if (rightPhase === 'routes')
        return -1;

      return phaseOrder['routes'] - phaseOrder[rightPhase];
    }

    if (rightPhase === undefined)
      return -compareLayers(right, left);

    // Layers registered via `app.middleware` are compared via phase & hook
    return phaseOrder[leftPhase] - phaseOrder[rightPhase];
  }
};
