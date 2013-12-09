var _describe = {};
var _it = {};
var _beforeEach = {};
var helpers = module.exports = {
  describe: _describe,
  it: _it,
  beforeEach: _beforeEach
};
var loopback = require('./loopback');
var assert = require('assert');
var request = require('supertest');
var qs = require('qs');

_beforeEach.withApp = function(app) {
  beforeEach(function() {
    this.app = app;
    var _request = this.request = request(app);
    this.post = _request.post;
    this.get = _request.get;
    this.put = _request.put;
    this.del = _request.del;
  });
}

_describe.model = function describeModel(app, modelName, cb) {
  assert(app, 'describeModel called without app');

  describe('Model: ' + modelName, function() {
    beforeEach(function() {
      this.app = app;
      this.model = loopback.getModel(modelName);
      assert(this.model, 'you must define a model before testing it');
    });
    cb();
  });
}

function mixin(obj, into) {
  Object.keys(obj).forEach(function(key) {
    if(typeof obj[key] === 'function') {
      into[key] = obj[key];
    }
  });
}

_describe.staticMethod = function(methodName, cb) {
  describe('.' + methodName, function() {
    beforeEach(function() {
      this.method = methodName;
      this.isStaticMethod = true;
    });
    cb();
  });
}

_describe.instanceMethod = function(methodName, cb) {
  describe('.prototype.' + methodName, function() {
    beforeEach(function() {
      this.method = methodName;
      this.isInstanceMethod = true;
    });
    cb();
  });
}

_beforeEach.withArgs = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  beforeEach(function() {
    this.args = args;
  });
}

_beforeEach.givenModel = function(modelName, attrs, optionalHandler) {
  if(typeof attrs === 'funciton') {
    optionalHandler = attrs;
    attrs = undefined;
  }

  attrs = attrs || {};

  var model = loopback.getModel(modelName);

  beforeEach(function(done) {
    var test = this;
    model.create(attrs, function(err, result) {
      if(err) {
        done(err);
      } else {
        test[modelName] = result;
        done();
      }
    });
  });

  if(typeof optionalHandler === 'function') {
    beforeEach(optionalHandler);
  }

  afterEach(function(done) {
    this[modelName].destroy(done);
  });
}

_beforeEach.givenUser = function(attrs, optionalHandler) {
  _beforeEach.givenModel('user', attrs, optionalHandler);
}

_beforeEach.givenAnUnauthenticatedToken = function(attrs, optionalHandler) {
  _beforeEach.givenModel('accessToken', attrs, optionalHandler);
}

_beforeEach.givenAnAnonymousToken = function(attrs, optionalHandler) {
  _beforeEach.givenModel('accessToken', {id: '$anonymous'}, optionalHandler);
}

_describe.whenCalledRemotely = function(verb, url, cb) {
  var urlStr = url;
  if(typeof url === 'function') {
    urlStr = '/<dynamic>';
  }
  describe(verb.toUpperCase() + ' ' + urlStr, function() {
    beforeEach(function(cb) {
      if(typeof url === 'function') {
        url = url.call(this);
      }
      this.remotely = true;
      this.verb = verb.toUpperCase();
      this.url = url;
      var methodForVerb = verb.toLowerCase();
      if(methodForVerb === 'delete') methodForVerb = 'del';

      this.http = this.request[methodForVerb](url);
      this.http.set('Accept', 'application/json');
      this.req = this.http.req;
      var test = this;
      this.http.end(function(err) {
        test.res = test.http.res;
        cb();
      });
    });

    cb();
  });
}

_describe.whenCalledByUser = function(credentials, verb, url, cb) {
  _describe.whenLoggedInAsUser(credentials, function() {
    _describe.whenCalledRemotely(verb, url, cb);
  });
}

_describe.whenCalledAnonymously = function(verb, url, cb) {
  _describe.whenCalledRemotely(verb, url, function() {
    _beforeEach.givenAnAnonymousToken();
    cb();
  });
}

_describe.whenCalledUnauthenticated = function(verb, url, cb) {
  _describe.whenCalledRemotely(verb, url, function() {
    _beforeEach.givenAnUnauthenticatedToken();
    cb();
  });
}

_describe.whenLoggedInAsUser = function(credentials, cb) {
  describe('when logged in user', function() {
    _beforeEach.givenUser(credentials, function(done) {
      var test = this;
      this.remotely = true;
      this.user.constructor.login(credentials, function(err, token) {
        if(err) {
          done(err);
        } else {
          test.accessToken = token;
          test.req.set('authorization', token.id);
          done();
        }
      });
    });

    afterEach(function(done) {
      this.accessToken.destroy(done);
    });
  });
}

_it.shouldBeAllowed = function() {
  it('should be allowed', function() {
    assert(this.req);
    assert(this.res);
    assert.notEqual(this.res.statusCode, 401);
  });
}

_it.shouldBeDenied = function() {
  it('should not be allowed', function() {
    assert(this.res);
    assert.equal(this.res.statusCode, 401);
  });
}

_it.shouldBeAllowedWhenCalledAnonymously =
function(verb, url) {
  _describe.whenCalledAnonymously(verb, url, function() {
    _it.shouldBeAllowed();
  });
}

_it.shouldBeDeniedWhenCalledAnonymously =
function(verb, url) {
  _describe.whenCalledAnonymously(verb, url, function() {
    _it.shouldBeDenied();
  });
}

_it.shouldBeAllowedWhenCalledUnauthenticated =
function(verb, url) {
  _describe.whenCalledUnauthenticated(verb, url, function() {
    _it.shouldBeAllowed();
  });
}

_it.shouldBeDeniedWhenCalledUnauthenticated =
function(verb, url) {
  _describe.whenCalledUnauthenticated(verb, url, function() {
    _it.shouldBeDenied();
  });
}

_it.shouldBeAllowedWhenCalledByUser =
function(credentials, verb, url) {
  _describe.whenCalledByUser(credentials, verb, url, function() {
    _it.shouldBeAllowed();
  });
}

_it.shouldBeDeniedWhenCalledByUser =
function(credentials, verb, url) {
  _describe.whenCalledByUser(credentials, verb, url, function() {
    _it.shouldBeDenied();
  });
}
