var assert = require('assert');
var express = require('express');
var PhaseList = require('loopback-phase').PhaseList;
var ExpressRouter = express.Router;
var MiddlewarePhase = require('./middleware-phase');

var proto = Object.create(ExpressRouter);

proto.__expressHandle = proto.handle;

/**
 * PhasedRouter extends Express router with phase semantics.
 *
 * **Example**
 *
 * ```js
 * var router = new PhasedRouter();
 *
 * // by default, middleware is registered in "routes" phase
 * router.use(function(req, res, next) { ... };
 *
 * // register a middleware with a specific phase
 * router.phase('init').use(function(req, res, next) { ... });
 *
 * // register a middleware to be run at the beginning/end of a phase
 * router.phase('init').before(function(req, res, next) { ... });
 * router.phase('init').after(function(req, res, next) { ... });
 * ```
 *
 * @param {object} options Router options - see Express docs for details.
 * @returns {DecoratedRouter}
 * @class DecoratedRouter
 */
module.exports = function PhasedRouter(options) {
  var router = new ExpressRouter(options);

  /* jshint proto:true */
  // mixin PhasedRouter class functions
  router.__proto__ = proto;

  router._phases = new PhaseList();
  router._phases.add(
    ['init', 'routes', 'files', 'error']
      .map(function(name) { return new MiddlewarePhase(name); })
  );

  // Handlers registered with the root router are executed in 'routes' phase
  router._phases.find('routes').use(function(req, res, next) {
    return router.__expressHandle(req, res, next);
  });

  // TODO(bajtos) refactor PhaseList.run and provide a customization hook
  router._phases.run = function(ctx, cb) {
    assert(!!ctx, 'ctx');

    var async = require('async');
    var phases = this._phases;

    if (phases.length) {
      async.eachSeries(
        phases,
        function(phase, next) {
          phase.run(ctx, function(err) {
            MiddlewarePhase.passErrorToNextPhase(err, ctx.req);
            next();
          });
        },
        function(err) {
          if (err) return cb(err);
          MiddlewarePhase.raiseErrorThrownByPreviousPhase(ctx.req, ctx.res, cb);
        });
    } else {
      process.nextTick(cb);
    }
  };

  return router;
};

proto.phase = function(name) {
  // TODO(bajtos) We need .get(name) that throws a descriptive error
  // when the phase was not found
  return this._phases.find(name);
};

proto.handle = function(req, res, done) {
  var ctx = { req: req, res: res };
  this._phases.run(ctx, done);
};
