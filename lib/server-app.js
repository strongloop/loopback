var assert = require('assert');
var express = require('express');
var merge = require('util')._extend;
var PhaseList = require('loopback-phase').PhaseList;
var debug = require('debug')('loopback:app');
var pathToRegexp = require('path-to-regexp');

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
    this._requestHandlingPhases.zipMerge(nameOrArray);
  } else {
    this._requestHandlingPhases.addBefore('routes', nameOrArray);
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
    paths = [];
  }

  if (typeof paths === 'string' || paths instanceof RegExp) {
    paths = [paths];
  }

  assert(typeof name === 'string' && name, '"name" must be a non-empty string');
  assert(typeof handler === 'function', '"handler" must be a function');
  assert(Array.isArray(paths), '"paths" must be an array');

  var fullName = name;
  var handlerName = handler.name || '(anonymous)';

  var hook = 'use';
  var m = name.match(/^(.+):(before|after)$/);
  if (m) {
    name = m[1];
    hook = m[2];
  }

  var phase = this._requestHandlingPhases.find(name);
  if (!phase)
    throw new Error('Unknown middleware phase ' + name);

  var matches = createRequestMatcher(paths);

  var wrapper;
  if (handler.length === 4) {
    // handler is function(err, req, res, next)
    debug('Add error handler %j to phase %j', handlerName, fullName);

    wrapper = function errorHandler(ctx, next) {
      if (ctx.err && matches(ctx.req)) {
        var err = ctx.err;
        ctx.err = undefined;
        handler(err, ctx.req, ctx.res, storeErrorAndContinue(ctx, next));
      } else {
        next();
      }
    };
  } else {
    // handler is function(req, res, next)
    debug('Add middleware %j to phase %j', handlerName , fullName);
    wrapper = function regularHandler(ctx, next) {
      if (ctx.err || !matches(ctx.req)) {
        next();
      } else {
        handler(ctx.req, ctx.res, storeErrorAndContinue(ctx, next));
      }
    };
  }

  phase[hook](wrapper);
  return this;
};

function createRequestMatcher(paths) {
  if (!paths.length) {
    return function requestMatcher(req) { return true; };
  }

  var checks = paths.map(function(p) {
    return pathToRegexp(p, {
      sensitive: true,
      strict: false,
      end: false
    });
  });

  return function requestMatcher(req) {
    return checks.some(function(regex) {
      return regex.test(req.url);
    });
  };
}

function storeErrorAndContinue(ctx, next) {
  return function(err) {
    if (err) ctx.err = err;
    next();
  };
}

// Install our custom PhaseList-based handler into the app
proto.lazyrouter = function() {
  var self = this;
  if (self._router) return;

  self.__expressLazyRouter();

  // Storing the fn in another property of the router object
  // allows us to call the method with the router as `this`
  // without the need to use slow `call` or `apply`.
  self._router.__expressHandle = self._router.handle;

  self._requestHandlingPhases = new PhaseList();
  self._requestHandlingPhases.add([
    'initial', 'session', 'auth', 'parse',
    'routes', 'files', 'final'
  ]);

  // In order to pass error into express router, we have
  // to pass it to a middleware executed from within the router.
  // This is achieved by adding a phase-handler that wraps the error
  // into `req` object and then a router-handler that unwraps the error
  // and calls `next(err)`.
  // It is important to register these two handlers at the very beginning,
  // before any other handlers are added.
  self.middleware('routes', function wrapError(err, req, res, next) {
    req.__err = err;
    next();
  });

  self.use(function unwrapError(req, res, next) {
    var err = req.__err;
    req.__err = undefined;
    next(err);
  });

  self.middleware('routes', function runRootHandlers(req, res, next) {
    self._router.__expressHandle(req, res, next);
  });

  // Overwrite the original handle() function provided by express,
  // replace it with our implementation based on PhaseList
  self._router.handle = function(req, res, next) {
    var ctx = { req: req, res: res };
    self._requestHandlingPhases.run(ctx, function(err) {
      next(err || ctx.err);
    });
  };
};
