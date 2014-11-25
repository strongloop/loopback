var loopback = require('../');
var request = require('supertest');

describe('remoting coercion', function() {
  it('should coerce arguments based on the type', function(done) {
    var called = false;
    var app = loopback();
    app.use(loopback.rest());

    var TestModel = app.model('TestModel', {base: 'Model', dataSource: null, public: true});
    TestModel.test = function(inst, cb) {
      called = true;
      assert(inst instanceof TestModel);
      assert(inst.foo === 'bar');
      cb();
    };
    TestModel.remoteMethod('test', {
      accepts: {arg: 'inst', type: 'TestModel', http: {source: 'body'}},
      http: {path: '/test', verb: 'post'}
    });

    request(app)
      .post('/TestModels/test')
      .set('Content-Type', 'application/json')
      .send({
        foo: 'bar'
      })
      .end(function(err) {
        if (err) return done(err);
        assert(called);
        done();
      });
  });
});
