var loopback = require('../');
var lt = require('loopback-testing');
var path = require('path');
var SIMPLE_APP = path.join(__dirname, 'fixtures', 'simple-integration-app');
var app = require(path.join(SIMPLE_APP, 'app.js'));
var assert = require('assert');

describe('remoting - integration', function () {

  lt.beforeEach.withApp(app);
  lt.beforeEach.givenModel('store');

  afterEach(function (done) {
    this.app.models.store.destroyAll(done);
  });

  describe('app.remotes.options', function () {
    it("should load remoting options", function () {
      var remotes = app.remotes();
      assert.deepEqual(remotes.options, {"json": {"limit": "1kb", "strict": false},
        "urlencoded": {"limit": "8kb"}});
    });

    it("rest handler", function () {
      var handler = app.handler('rest');
      assert(handler);
    });

    it('should accept request that has entity below 1kb', function (done) {
      // Build an object that is smaller than 1kb
      var name = "";
      for (var i = 0; i < 256; i++) {
        name += "11";
      }
      this.http = this.post('/api/stores');
      this.http.send({
        "name": name
      });
      this.http.end(function (err) {
        if (err) return done(err);
        this.req = this.http.req;
        this.res = this.http.res;
        assert.equal(this.res.statusCode, 200);
        done();
      }.bind(this));
    });

    it('should reject request that has entity beyond 1kb', function (done) {
      // Build an object that is larger than 1kb
      var name = "";
      for (var i = 0; i < 2048; i++) {
        name += "11111111111";
      }
      this.http = this.post('/api/stores');
      this.http.send({
        "name": name
      });
      this.http.end(function (err) {
        if (err) return done(err);
        this.req = this.http.req;
        this.res = this.http.res;
        // Request is rejected with 413
        assert.equal(this.res.statusCode, 413);
        done();
      }.bind(this));
    });
  });

});
