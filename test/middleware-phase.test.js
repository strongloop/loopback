var extend = require('util')._extend;
var MiddlewarePhase = require('../lib/middleware-phase');
var expect = require('chai').expect;

describe('middleware-phase', function() {
  it('executes middleware in the correct order', function(done) {
    var phase = new MiddlewarePhase();
    var steps = [];
    var ctx = givenRouterContext();

    var handlerFn = function(name) {
      return function(req, res, next) {
        expect(req, name + '.req').to.equal(ctx.req);
        expect(res, name + '.res').to.equal(ctx.res);
        steps.push(name);
        next();
      };
    };

    phase.use(handlerFn('use'));
    phase.before(handlerFn('before'));
    phase.after(handlerFn('after'));

    phase.run(ctx, function verify(err) {
      if (err) return done(err);
      expect(steps).to.eql(['before', 'use', 'after']);
      done();
    });
  });

  it('passes errors to the next handler', function(done) {
    var phase = new MiddlewarePhase();
    var expectedError = new Error('expected error');

    phase.before(function(req, res, next) {
      next(expectedError);
    });

    phase.after(function(err, req, res, next) {
      expect(err).to.equal(expectedError);
      done();
    });

    phase.run(givenRouterContext(), function(err) {
      if (err && err !== expectedError) return done(err);
      done(new Error(
        'The handler chain should have been stopped by error handler'));
    });
  });
});

function givenRequest(props) {
  return extend({ url: '/test/url', method: 'GET' }, props);
}

function givenResponse(props) {
  return extend({}, props);
}

function givenRouterContext(req, res) {
  return {
    req: givenRequest(req),
    res: givenResponse(res)
  };
}
