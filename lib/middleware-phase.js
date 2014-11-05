var assert = require('assert');
var Phase = require('loopback-phase').Phase;
var inherits = require('util').inherits;

/**
 * MiddlewarePhase accepts middleware functions for `use`, `before` and `after`.
 *
 * @param {string} id The phase name (id).
 * @class MiddlewarePhase
 */
function MiddlewarePhase(id) {
  Phase.apply(this, arguments);
}

module.exports = MiddlewarePhase;

inherits(MiddlewarePhase, Phase);

// TODO(bajtos) add a customization hook to Phase
['before', 'use', 'after'].forEach(function decorate(name) {
  MiddlewarePhase.prototype[name] = function(fn) {
    var wrapper;

    if (fn.length === 4) {
      wrapper = function errorHandler(ctx, next) {
        if (ctx.err) {
          var err = ctx.err;
          ctx.err = undefined;
          fn(err, ctx.req, ctx.res, storeErrorAndContinue(ctx, next));
        } else {
          next();
        }
      };
    } else {
      wrapper = function regularHandler(ctx, next) {
        if (ctx.err) {
          next();
        } else {
          fn(ctx.req, ctx.res, storeErrorAndContinue(ctx, next));
        }
      };
    }

    MiddlewarePhase.super_.prototype[name].call(this, wrapper);
  };
});

function storeErrorAndContinue(ctx, next) {
  return function(err) {
    if (err) ctx.err = err;
    next();
  };
}
