var loopback = require('loopback');
var request = require('supertest');
var Domain = require('domain');
var assert = require('assert');
var EventEmitter = require("events").EventEmitter;

describe('check loopback.getCurrentContext', function() {
  var app = loopback();
  var runInOtherDomain;
  var runnerInterval;

  before(function(){
    var called = false;
    app.use(loopback.rest());
    app.dataSource('db', { connector: 'memory' });
    app.dataSource('mongox', {
        "host": "localhost",
        "port": 27017,
        "database": "api",
        "username": "root",
        "password": "123456",
        "name": "mongodb",
        "connector": "mongodb"
      });

    var TestModel = loopback.createModel({name: 'TestModel', properties: {name: String}, options: { base: 'Model'}});
    app.model(TestModel, {dataSource: "db", public: true});

    var emitterInOtherDomain = new EventEmitter();
    Domain.create().add(emitterInOtherDomain);

    runInOtherDomain = function(fn) {
      emitterInOtherDomain.once('run', fn);
    }

    runnerInterval = setInterval(function() { emitterInOtherDomain.emit('run'); }, 10);

    // function for remote method
    TestModel.test = function(inst, cb) {
      tmpCtx = loopback.getCurrentContext();
      if (tmpCtx) tmpCtx.set('data', 'test');
      called = true;
      if (process.domain) cb = process.domain.bind(cb);  // IMPORTANT
      runInOtherDomain(cb);
    };

    // remote method
    TestModel.remoteMethod('test', {
      accepts: {arg: 'inst', type: 'TestModel'},
      returns: {root: true},
      http: {path: '/test', verb: 'get'}
    });

    // after remote hook
    TestModel.afterRemote('**', function(ctxx, inst, next){
      ctxx.result.called = called;
      tmpCtx = loopback.getCurrentContext();
      if (tmpCtx) {
        ctxx.result.data = tmpCtx.get('data');
      }else {
        ctxx.result.data = "";
      }
      next();
    });
  });

  after(function tearDownRunInOtherDomain() {
    clearInterval(runnerInterval);
  });

  it('should fail without the patch and it should pass once the patch is applied', function(done) {
    request(app)
      .get('/TestModels/test')
      .end(function(err, res) {
        if (err) return done(err);
        assert.equal(res.body.called, true);
        assert.equal(res.body.data, 'test');
        done();
      });
  });
});