// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var _describe = {};
var _it = {};
var _beforeEach = {};
var helpers = {
  describe: _describe,
  it: _it,
  beforeEach: _beforeEach,
};
module.exports = helpers;

var assert = require('assert');
var request = require('supertest');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
chai.use(require('sinon-chai'));

_beforeEach.withApp = function(app) {
  if (app.models.User) {
    // Speed up the password hashing algorithm
    app.models.User.settings.saltWorkFactor = 4;
  }

  beforeEach(function(done) {
    this.app = app;
    var _request = this.request = request(app);
    this.post = _request.post;
    this.get = _request.get;
    this.put = _request.put;
    this.del = _request.del;

    if (app.booting) {
      return app.once('booted', done);
    }

    done();
  });
};

_beforeEach.withArgs = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  beforeEach(function() {
    this.args = args;
  });
};

_beforeEach.givenModel = function(modelName, attrs, optionalHandler) {
  var modelKey = modelName;

  if (typeof attrs === 'function') {
    optionalHandler = attrs;
    attrs = undefined;
  }

  if (typeof optionalHandler === 'string') {
    modelKey = optionalHandler;
  }

  attrs = attrs || {};

  beforeEach(function(done) {
    var test = this;
    var app = this.app;
    var model = app.models[modelName];

    app.set('remoting', {errorHandler: {debug: true, log: false}});
    assert(model, 'cannot get model of name ' + modelName + ' from app.models');
    assert(model.dataSource, 'cannot test model ' + modelName +
        ' without attached dataSource');
    assert(
      typeof model.create === 'function',
      modelName + ' does not have a create method'
    );

    model.create(attrs, function(err, result) {
      if (err) {
        console.error(err.message);
        if (err.details) console.error(err.details);

        done(err);
      } else {
        test[modelKey] = result;

        done();
      }
    });
  });

  if (typeof optionalHandler === 'function') {
    beforeEach(optionalHandler);
  }

  afterEach(function(done) {
    this[modelKey].destroy(done);
  });
};

_beforeEach.givenUser = function(attrs, optionalHandler) {
  _beforeEach.givenModel('user', attrs, optionalHandler);
};

_beforeEach.givenLoggedInUser = function(credentials, optionalHandler) {
  _beforeEach.givenUser(credentials, function(done) {
    var test = this;
    this.user.constructor.login(credentials, function(err, token) {
      if (err) {
        done(err);
      } else {
        test.loggedInAccessToken = token;

        done();
      }
    });
  });

  afterEach(function(done) {
    var test = this;
    this.loggedInAccessToken.destroy(function(err) {
      if (err) return done(err);

      test.loggedInAccessToken = undefined;

      done();
    });
  });
};

_beforeEach.givenAnUnauthenticatedToken = function(attrs, optionalHandler) {
  _beforeEach.givenModel('accessToken', attrs, optionalHandler);
};

_beforeEach.givenAnAnonymousToken = function(attrs, optionalHandler) {
  _beforeEach.givenModel('accessToken', {id: '$anonymous'}, optionalHandler);
};

_describe.whenCalledRemotely = function(verb, url, data, cb) {
  if (cb === undefined) {
    cb = data;
    data = null;
  }

  var urlStr = url;
  if (typeof url === 'function') {
    urlStr = '/<dynamic>';
  }

  describe(verb.toUpperCase() + ' ' + urlStr, function() {
    beforeEach(function(cb) {
      if (typeof url === 'function') {
        this.url = url.call(this);
      }
      this.remotely = true;
      this.verb = verb.toUpperCase();
      this.url = this.url || url;
      var methodForVerb = verb.toLowerCase();
      if (methodForVerb === 'delete') methodForVerb = 'del';

      if (this.request === undefined) {
        var msg = 'App is not specified. ' +
          'Please use lt.beforeEach.withApp to specify the app.';
        throw new Error(msg);
      }

      this.http = this.request[methodForVerb](this.url);
      delete this.url;
      this.http.set('Accept', 'application/json');
      if (this.loggedInAccessToken) {
        this.http.set('authorization', this.loggedInAccessToken.id);
      }
      if (data) {
        var payload = data;
        if (typeof data === 'function')
          payload = data.call(this);
        this.http.send(payload);
      }
      this.req = this.http.req;
      var test = this;
      this.http.end(function(err) {
        test.req = test.http.req;
        test.res = test.http.res;
        delete test.url;

        cb();
      });
    });

    cb();
  });
};

_describe.whenLoggedInAsUser = function(credentials, cb) {
  describe('when logged in as user', function() {
    _beforeEach.givenLoggedInUser(credentials);

    cb();
  });
};

_describe.whenCalledByUser = function(credentials, verb, url, data, cb) {
  describe('when called by logged in user', function() {
    _beforeEach.givenLoggedInUser(credentials);
    _describe.whenCalledRemotely(verb, url, data, cb);
  });
};

_describe.whenCalledAnonymously = function(verb, url, data, cb) {
  describe('when called anonymously', function() {
    _beforeEach.givenAnAnonymousToken();
    _describe.whenCalledRemotely(verb, url, data, cb);
  });
};

_describe.whenCalledUnauthenticated = function(verb, url, data, cb) {
  describe('when called with unauthenticated token', function() {
    _beforeEach.givenAnAnonymousToken();
    _describe.whenCalledRemotely(verb, url, data, cb);
  });
};

_it.shouldBeAllowed = function() {
  it('should be allowed', function() {
    assert(this.req);
    assert(this.res);
    // expect success - status 2xx or 3xx
    expect(this.res.statusCode).to.be.within(100, 399);
  });
};

_it.shouldBeDenied = function() {
  it('should not be allowed', function() {
    assert(this.res);
    var expectedStatus = this.aclErrorStatus ||
      this.app && this.app.get('aclErrorStatus') ||
      401;
    expect(this.res.statusCode).to.equal(expectedStatus);
  });
};

_it.shouldNotBeFound = function() {
  it('should not be found', function() {
    assert(this.res);
    assert.equal(this.res.statusCode, 404);
  });
};

_it.shouldBeAllowedWhenCalledAnonymously =
function(verb, url, data) {
  _describe.whenCalledAnonymously(verb, url, data, function() {
    _it.shouldBeAllowed();
  });
};

_it.shouldBeDeniedWhenCalledAnonymously =
function(verb, url) {
  _describe.whenCalledAnonymously(verb, url, function() {
    _it.shouldBeDenied();
  });
};

_it.shouldBeAllowedWhenCalledUnauthenticated =
function(verb, url, data) {
  _describe.whenCalledUnauthenticated(verb, url, data, function() {
    _it.shouldBeAllowed();
  });
};

_it.shouldBeDeniedWhenCalledUnauthenticated =
function(verb, url) {
  _describe.whenCalledUnauthenticated(verb, url, function() {
    _it.shouldBeDenied();
  });
};

_it.shouldBeAllowedWhenCalledByUser =
function(credentials, verb, url, data) {
  _describe.whenCalledByUser(credentials, verb, url, data, function() {
    _it.shouldBeAllowed();
  });
};

_it.shouldBeDeniedWhenCalledByUser =
function(credentials, verb, url) {
  _describe.whenCalledByUser(credentials, verb, url, function() {
    _it.shouldBeDenied();
  });
};
