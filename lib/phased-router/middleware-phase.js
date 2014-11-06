var assert = require('assert');
var ExpressRouter = require('express').Router;
var DecoratedRouter = require('./decorated-router');
var inherits = require('util').inherits;

var proto = Object.create(DecoratedRouter);

/**
 * MiddlewarePhase implements Expres router API like `.use(handler)`
 * and Phase API `.before(handler)` and `.after(handler)`.
 *
 * @param {string} id The phase name (id).
 * @param {object} routerOptions The options to pass to Express router.
 * @returns {DecoratedRouter}
 * @class MiddlewarePhase
 */
exports = module.exports = function MiddlewarePhase(id, routerOptions) {
  var router = new DecoratedRouter(routerOptions);

  /* jshint proto:true */
  // mixin MiddlewarePhase class functions
  router.__proto__ = proto;

  router.id = id;
  router._before = new ExpressRouter(routerOptions);
  router._after = new ExpressRouter(routerOptions);

  router.before(raiseErrorThrownByPreviousPhase);
  router.use(raiseErrorThrownByPreviousPhase);
  router.after(raiseErrorThrownByPreviousPhase);

  return router;
};

proto.__isPhase__ = true;

/*--- Phase API ---*/

function raiseErrorThrownByPreviousPhase(req, res, next) {
  var err = req.__phaseError;
  req.__phaseError = undefined;
  next(err);
}

function passErrorToNextPhase(err, req) {
  req.__phaseError = err;
}

proto.run = function(ctx, done) {
  var req = ctx.req;
  var res = ctx.res;

  assert(!!req, 'ctx.req');
  assert(!!res, 'ctx.res');

  this.handle(req, res, done);
};

proto.before = function(handler) {
  this._before.use.apply(this._before, arguments);
};

proto.after = function(handler) {
  this._after.use.apply(this._after, arguments);
};

/*--- Router API ---*/

proto.handle = function(req, res, done) {
  var self = this;
  self._before.handle(req, res, function(err) {
    passErrorToNextPhase(err, req);
    self._super.handle(req, res, function(err) {
      passErrorToNextPhase(err, req);
      self._after.handle(req, res, done);
    });
  });
};

/*--- Helpers ---*/

exports.passErrorToNextPhase = passErrorToNextPhase;
exports.raiseErrorThrownByPreviousPhase = raiseErrorThrownByPreviousPhase;
