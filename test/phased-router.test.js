var methods = require('methods')
var PhasedRouter = require('../lib/phased-router');
var extend = require('util')._extend;

var assert = require('assert');
var chai = require('chai');
var expect = chai.expect;
chai.should();

describe('phased-router', function() {
  describe('as phased router', function() {
    var PREDEFINED_PHASES = ['init', 'routes', 'files', 'error'];

    PREDEFINED_PHASES.forEach(function(name) {
      it('has built-in phase "' + name + '"', function() {
        var router = new PhasedRouter();
        var phase = router.phase(name);
        expect(phase).to.not.equal(undefined);
        expect(phase).to.have.property('__isPhase__', true);
      });
    });

    it('executes middleware in order defined by phases', function(done) {
      var router = new PhasedRouter();
      var steps = [];
      var reqStub = givenRequest();
      var resStub = givenResponse();

      PREDEFINED_PHASES.forEach(function(name) {
        router.phase(name).use(function(req, res, next) {
          expect(req, name + '.req').to.equal(reqStub);
          expect(res, name + '.res').to.equal(resStub);
          steps.push(name);
          next();
        });
      });

      router.handle(reqStub, resStub, function verify(err) {
        if (err) return done(err);
        expect(steps).to.eql(PREDEFINED_PHASES);
        done();
      });
    });

    it('executes root handlers in "routes" phase', function(done) {
      var router = new PhasedRouter();
      var steps = [];
      var reqStub = givenRequest();
      var resStub = givenResponse();
      var handlerFn = function(name) {
        return function(req, res, next) {
          steps.push(name);
          next();
        };
      };

      router.use(handlerFn('root'));
      router.phase('routes').before(handlerFn('routes:before'));
      router.phase('routes').after(handlerFn('routes:after'));

      router.handle(reqStub, resStub, function verify(err) {
        if (err) return done(err);
        expect(steps).to.eql(['routes:before', 'root', 'routes:after']);
        done();
      });
    });
  });

  testAsExpressRouter(PhasedRouter);
});

describe('middleware-phase', function() {
  var MiddlewarePhase = require('../lib/phased-router/middleware-phase');

  it('creates a function', function() {
    expect(new MiddlewarePhase()).to.be.a('function');
  });

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

  testAsExpressRouter(MiddlewarePhase);
});

describe('decorated-router', function() {
  var DecoratedRouter = require('../lib/phased-router/decorated-router');

  it('creates a function', function() {
    expect(new DecoratedRouter()).to.be.a('function');
  });

  testAsExpressRouter(DecoratedRouter);
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

function testAsExpressRouter(Router) {
  // unit-tests from express:test/Router.js
  describe('as express router', function() {
    it('should return a function with router methods', function() {
      var router = Router();
      assert(typeof router == 'function');

      var router = new Router();
      assert(typeof router == 'function');

      assert(typeof router.get == 'function');
      assert(typeof router.handle == 'function');
      assert(typeof router.use == 'function');
    });

    it('should support .use of other routers', function(done) {
      var router = new Router();
      var another = new Router();

      another.get('/bar', function(req, res) {
        res.end();
      });
      router.use('/foo', another);

      router.handle({ url: '/foo/bar', method: 'GET' }, { end: done });
    });

    it('should support dynamic routes', function(done) {
      var router = new Router();
      var another = new Router();

      another.get('/:bar', function(req, res) {
        req.params.bar.should.equal('route');
        res.end();
      });
      router.use('/:foo', another);

      router.handle({ url: '/test/route', method: 'GET' }, { end: done });
    });

    it('should handle blank URL', function(done) {
      var router = new Router();

      router.use(function(req, res) {
        false.should.be.true;
      });

      router.handle({ url: '', method: 'GET' }, {}, done);
    });

    describe('.handle', function() {
      it('should dispatch', function(done) {
        var router = new Router();

        router.route('/foo').get(function(req, res) {
          res.send('foo');
        });

        var res = {
          send: function(val) {
            val.should.equal('foo');
            done();
          }
        }
        router.handle({ url: '/foo', method: 'GET' }, res);
      })
    });

    describe('.multiple callbacks', function() {
      it('should throw if a callback is null', function() {
        assert.throws(function() {
          var router = new Router();
          router.route('/foo').all(null);
        })
      })

      it('should throw if a callback is undefined', function() {
        assert.throws(function() {
          var router = new Router();
          router.route('/foo').all(undefined);
        })
      })

      it('should throw if a callback is not a function', function() {
        assert.throws(function() {
          var router = new Router();
          router.route('/foo').all('not a function');
        })
      })

      it('should not throw if all callbacks are functions', function() {
        var router = new Router();
        router.route('/foo').all(function() {}).all(function() {});
      })
    })

    describe('error', function() {
      it('should skip non error middleware', function(done) {
        var router = new Router();

        router.get('/foo', function(req, res, next) {
          next(new Error('foo'));
        });

        router.get('/bar', function(req, res, next) {
          next(new Error('bar'));
        });

        router.use(function(req, res, next) {
          assert(false);
        });

        router.use(function(err, req, res, next) {
          assert.equal(err.message, 'foo');
          done();
        });

        router.handle({ url: '/foo', method: 'GET' }, {}, done);
      });

      it('should handle throwing inside routes with params', function(done) {
        var router = new Router();

        router.get('/foo/:id', function(req, res, next) {
          throw new Error('foo');
        });

        router.use(function(req, res, next) {
          assert(false);
        });

        router.use(function(err, req, res, next) {
          assert.equal(err.message, 'foo');
          done();
        });

        router.handle({ url: '/foo/2', method: 'GET' }, {}, function() {});
      });

      it('should handle throwing in handler after async param', function(done) {
        var router = new Router();

        router.param('user', function(req, res, next, val) {
          process.nextTick(function() {
            req.user = val;
            next();
          });
        });

        router.use('/:user', function(req, res, next) {
          throw new Error('oh no!');
        });

        router.use(function(err, req, res, next) {
          assert.equal(err.message, 'oh no!');
          done();
        });

        router.handle({ url: '/bob', method: 'GET' }, {}, function() {});
      });

      it('should handle throwing inside error handlers', function(done) {
        var router = new Router();

        router.use(function(req, res, next) {
          throw new Error('boom!');
        });

        router.use(function(err, req, res, next) {
          throw new Error('oops');
        });

        router.use(function(err, req, res, next) {
          assert.equal(err.message, 'oops');
          done();
        });

        router.handle({ url: '/', method: 'GET' }, {}, done);
      });
    })

    describe('.all', function() {
      it('should support using .all to capture all http verbs', function(done) {
        var router = new Router();

        var count = 0;
        router.all('/foo', function() { count++; });

        var url = '/foo?bar=baz';

        methods.forEach(function testMethod(method) {
          router.handle({ url: url, method: method }, {}, function() {});
        });

        assert.equal(count, methods.length);
        done();
      })
    })

    describe('.use', function() {
      it('should require arguments', function() {
        var router = new Router();
        router.use.bind(router).should.throw(/requires middleware function/)
      })

      it('should not accept non-functions', function() {
        var router = new Router();
        router.use.bind(router, '/', 'hello').should.throw(/requires middleware function.*string/)
        router.use.bind(router, '/', 5).should.throw(/requires middleware function.*number/)
        router.use.bind(router, '/', null).should.throw(/requires middleware function.*Null/)
        router.use.bind(router, '/', new Date()).should.throw(/requires middleware function.*Date/)
      })

      it('should accept array of middleware', function(done) {
        var count = 0;
        var router = new Router();

        function fn1(req, res, next) {
          assert.equal(++count, 1);
          next();
        }

        function fn2(req, res, next) {
          assert.equal(++count, 2);
          next();
        }

        router.use([fn1, fn2], function(req, res) {
          assert.equal(++count, 3);
          done();
        });

        router.handle({ url: '/foo', method: 'GET' }, {}, function() {});
      })
    })

    describe('.param', function() {
      it('should call param function when routing VERBS', function(done) {
        var router = new Router();

        router.param('id', function(req, res, next, id) {
          assert.equal(id, '123');
          next();
        });

        router.get('/foo/:id/bar', function(req, res, next) {
          assert.equal(req.params.id, '123');
          next();
        });

        router.handle({ url: '/foo/123/bar', method: 'get' }, {}, done);
      });

      it('should call param function when routing middleware', function(done) {
        var router = new Router();

        router.param('id', function(req, res, next, id) {
          assert.equal(id, '123');
          next();
        });

        router.use('/foo/:id/bar', function(req, res, next) {
          assert.equal(req.params.id, '123');
          assert.equal(req.url, '/baz');
          next();
        });

        router.handle({ url: '/foo/123/bar/baz', method: 'get' }, {}, done);
      });

      it('should only call once per request', function(done) {
        var count = 0;
        var req = { url: '/foo/bob/bar', method: 'get' };
        var router = new Router();
        var sub = new Router();

        sub.get('/bar', function(req, res, next) {
          next();
        });

        router.param('user', function(req, res, next, user) {
          count++;
          req.user = user;
          next();
        });

        router.use('/foo/:user/', new Router());
        router.use('/foo/:user/', sub);

        router.handle(req, {}, function(err) {
          if (err) return done(err);
          assert.equal(count, 1);
          assert.equal(req.user, 'bob');
          done();
        });
      });

      it('should call when values differ', function(done) {
        var count = 0;
        var req = { url: '/foo/bob/bar', method: 'get' };
        var router = new Router();
        var sub = new Router();

        sub.get('/bar', function(req, res, next) {
          next();
        });

        router.param('user', function(req, res, next, user) {
          count++;
          req.user = user;
          next();
        });

        router.use('/foo/:user/', new Router());
        router.use('/:user/bob/', sub);

        router.handle(req, {}, function(err) {
          if (err) return done(err);
          assert.equal(count, 2);
          assert.equal(req.user, 'foo');
          done();
        });
      });
    });
  });
}
