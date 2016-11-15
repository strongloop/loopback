// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var loopback = require('../');
var lt = require('./helpers/loopback-testing-helper');
var path = require('path');
var SIMPLE_APP = path.join(__dirname, 'fixtures', 'simple-integration-app');
var app = require(path.join(SIMPLE_APP, 'server/server.js'));
var assert = require('assert');
var expect = require('chai').expect;

describe('remoting - integration', function() {
  lt.beforeEach.withApp(app);
  lt.beforeEach.givenModel('store');

  afterEach(function(done) {
    this.app.models.store.destroyAll(done);
  });

  describe('app.remotes.options', function() {
    it('should load remoting options', function() {
      var remotes = app.remotes();
      assert.deepEqual(remotes.options, {'json': {'limit': '1kb', 'strict': false},
        'urlencoded': {'limit': '8kb', 'extended': true},
        'errorHandler': {'debug': true, log: false}});
    });

    it('rest handler', function() {
      var handler = app.handler('rest');
      assert(handler);
    });

    it('should accept request that has entity below 1kb', function(done) {
      // Build an object that is smaller than 1kb
      var name = '';
      for (var i = 0; i < 256; i++) {
        name += '11';
      }
      this.http = this.post('/api/stores');
      this.http.send({
        'name': name,
      });
      this.http.end(function(err) {
        if (err) return done(err);
        this.req = this.http.req;
        this.res = this.http.res;
        assert.equal(this.res.statusCode, 200);

        done();
      }.bind(this));
    });

    it('should reject request that has entity beyond 1kb', function(done) {
      // Build an object that is larger than 1kb
      var name = '';
      for (var i = 0; i < 2048; i++) {
        name += '11111111111';
      }
      this.http = this.post('/api/stores');
      this.http.send({
        'name': name,
      });
      this.http.end(function(err) {
        if (err) return done(err);
        this.req = this.http.req;
        this.res = this.http.res;
        // Request is rejected with 413
        assert.equal(this.res.statusCode, 413);

        done();
      }.bind(this));
    });
  });

  describe('Model shared classes', function() {
    it('has expected remote methods with default model.settings.replaceOnPUT' +
      'set to true (3.x)',
    function() {
      var storeClass = findClass('store');
      var methods = getFormattedMethodsExcludingRelations(storeClass.methods);

      var expectedMethods = [
        'create(data:object:store):store POST /stores',
        'patchOrCreate(data:object:store):store PATCH /stores',
        'replaceOrCreate(data:object:store):store PUT /stores',
        'replaceOrCreate(data:object:store):store POST /stores/replaceOrCreate',
        'exists(id:any):boolean GET /stores/:id/exists',
        'findById(id:any,filter:object):store GET /stores/:id',
        'replaceById(id:any,data:object:store):store PUT /stores/:id',
        'replaceById(id:any,data:object:store):store POST /stores/:id/replace',
        'find(filter:object):store GET /stores',
        'findOne(filter:object):store GET /stores/findOne',
        'updateAll(where:object,data:object:store):object POST /stores/update',
        'deleteById(id:any):object DELETE /stores/:id',
        'count(where:object):number GET /stores/count',
        'prototype.patchAttributes(data:object:store):store PATCH /stores/:id',
        'createChangeStream(options:object):ReadableStream POST /stores/change-stream',
      ];

      // The list of methods is from docs:
      // http://loopback.io/doc/en/lb2/Exposing-models-over-REST.html
      expect(methods).to.include.members(expectedMethods);
    });

    it('has expected remote methods for scopes', function() {
      var storeClass = findClass('store');
      var methods = getFormattedScopeMethods(storeClass.methods);

      var expectedMethods = [
        '__get__superStores(filter:object):store GET /stores/superStores',
        '__create__superStores(data:object:store):store POST /stores/superStores',
        '__delete__superStores() DELETE /stores/superStores',
        '__count__superStores(where:object):number GET /stores/superStores/count',
      ];

      expect(methods).to.include.members(expectedMethods);
    });

    it('should have correct signatures for belongsTo methods',
      function() {
        var widgetClass = findClass('widget');
        var methods = getFormattedPrototypeMethods(widgetClass.methods);

        var expectedMethods = [
          'prototype.__get__store(refresh:boolean):store ' +
            'GET /widgets/:id/store',
        ];
        expect(methods).to.include.members(expectedMethods);
      });

    it('should have correct signatures for hasMany methods',
      function() {
        var physicianClass = findClass('store');
        var methods = getFormattedPrototypeMethods(physicianClass.methods);

        var expectedMethods = [
          'prototype.__findById__widgets(fk:any):widget ' +
              'GET /stores/:id/widgets/:fk',
          'prototype.__destroyById__widgets(fk:any) ' +
              'DELETE /stores/:id/widgets/:fk',
          'prototype.__updateById__widgets(fk:any,data:object:widget):widget ' +
              'PUT /stores/:id/widgets/:fk',
          'prototype.__get__widgets(filter:object):widget ' +
              'GET /stores/:id/widgets',
          'prototype.__create__widgets(data:object:widget):widget ' +
              'POST /stores/:id/widgets',
          'prototype.__delete__widgets() ' +
              'DELETE /stores/:id/widgets',
          'prototype.__count__widgets(where:object):number ' +
              'GET /stores/:id/widgets/count',
        ];
        expect(methods).to.include.members(expectedMethods);
      });

    it('should have correct signatures for hasMany-through methods',
      function() { // jscs:disable validateIndentation
        var physicianClass = findClass('physician');
        var methods = getFormattedPrototypeMethods(physicianClass.methods);

        var expectedMethods = [
          'prototype.__findById__patients(fk:any):patient ' +
          'GET /physicians/:id/patients/:fk',
          'prototype.__destroyById__patients(fk:any) ' +
          'DELETE /physicians/:id/patients/:fk',
          'prototype.__updateById__patients(fk:any,data:object:patient):patient ' +
          'PUT /physicians/:id/patients/:fk',
          'prototype.__link__patients(fk:any,data:object:appointment):appointment ' +
          'PUT /physicians/:id/patients/rel/:fk',
          'prototype.__unlink__patients(fk:any) ' +
          'DELETE /physicians/:id/patients/rel/:fk',
          'prototype.__exists__patients(fk:any):boolean ' +
          'HEAD /physicians/:id/patients/rel/:fk',
          'prototype.__get__patients(filter:object):patient ' +
          'GET /physicians/:id/patients',
          'prototype.__create__patients(data:object:patient):patient ' +
          'POST /physicians/:id/patients',
          'prototype.__delete__patients() ' +
          'DELETE /physicians/:id/patients',
          'prototype.__count__patients(where:object):number ' +
          'GET /physicians/:id/patients/count',
        ];
        expect(methods).to.include.members(expectedMethods);
      });
  });

  it('has upsertWithWhere remote method', function() {
    var storeClass = findClass('store');
    var methods = getFormattedMethodsExcludingRelations(storeClass.methods);
    var expectedMethods = [
      'upsertWithWhere(where:object,data:object:store):store POST /stores/upsertWithWhere',
    ];
    expect(methods).to.include.members(expectedMethods);
  });
});

describe('With model.settings.replaceOnPUT false', function() {
  lt.beforeEach.withApp(app);
  lt.beforeEach.givenModel('storeWithReplaceOnPUTfalse');
  afterEach(function(done) {
    this.app.models.storeWithReplaceOnPUTfalse.destroyAll(done);
  });

  it('should have expected remote methods',
  function() {
    var storeClass = findClass('storeWithReplaceOnPUTfalse');
    var methods = getFormattedMethodsExcludingRelations(storeClass.methods);

    var expectedMethods = [
      'create(data:object:storeWithReplaceOnPUTfalse):storeWithReplaceOnPUTfalse POST /stores-updating',
      'patchOrCreate(data:object:storeWithReplaceOnPUTfalse):storeWithReplaceOnPUTfalse PUT /stores-updating',
      'patchOrCreate(data:object:storeWithReplaceOnPUTfalse):storeWithReplaceOnPUTfalse PATCH /stores-updating',
      'replaceOrCreate(data:object:storeWithReplaceOnPUTfalse):storeWithReplaceOnPUTfalse POST /stores-updating/replaceOrCreate',
      'upsertWithWhere(where:object,data:object:storeWithReplaceOnPUTfalse):storeWithReplaceOnPUTfalse POST /stores-updating/upsertWithWhere',
      'exists(id:any):boolean GET /stores-updating/:id/exists',
      'exists(id:any):boolean HEAD /stores-updating/:id',
      'findById(id:any,filter:object):storeWithReplaceOnPUTfalse GET /stores-updating/:id',
      'replaceById(id:any,data:object:storeWithReplaceOnPUTfalse):storeWithReplaceOnPUTfalse POST /stores-updating/:id/replace',
      'find(filter:object):storeWithReplaceOnPUTfalse GET /stores-updating',
      'findOne(filter:object):storeWithReplaceOnPUTfalse GET /stores-updating/findOne',
      'updateAll(where:object,data:object:storeWithReplaceOnPUTfalse):object POST /stores-updating/update',
      'deleteById(id:any):object DELETE /stores-updating/:id',
      'count(where:object):number GET /stores-updating/count',
      'prototype.patchAttributes(data:object:storeWithReplaceOnPUTfalse):storeWithReplaceOnPUTfalse PUT /stores-updating/:id',
      'prototype.patchAttributes(data:object:storeWithReplaceOnPUTfalse):storeWithReplaceOnPUTfalse PATCH /stores-updating/:id',
      'createChangeStream(options:object):ReadableStream POST /stores-updating/change-stream',
      'createChangeStream(options:object):ReadableStream GET /stores-updating/change-stream',
    ];

    expect(methods).to.eql(expectedMethods);
  });
});

describe('With model.settings.replaceOnPUT true', function() {
  lt.beforeEach.withApp(app);
  lt.beforeEach.givenModel('storeWithReplaceOnPUTtrue');
  afterEach(function(done) {
    this.app.models.storeWithReplaceOnPUTtrue.destroyAll(done);
  });

  it('should have expected remote methods',
  function() {
    var storeClass = findClass('storeWithReplaceOnPUTtrue');
    var methods = getFormattedMethodsExcludingRelations(storeClass.methods);

    var expectedMethods = [
      'patchOrCreate(data:object:storeWithReplaceOnPUTtrue):storeWithReplaceOnPUTtrue PATCH /stores-replacing',
      'replaceOrCreate(data:object:storeWithReplaceOnPUTtrue):storeWithReplaceOnPUTtrue POST /stores-replacing/replaceOrCreate',
      'replaceOrCreate(data:object:storeWithReplaceOnPUTtrue):storeWithReplaceOnPUTtrue PUT /stores-replacing',
      'replaceById(id:any,data:object:storeWithReplaceOnPUTtrue):storeWithReplaceOnPUTtrue POST /stores-replacing/:id/replace',
      'replaceById(id:any,data:object:storeWithReplaceOnPUTtrue):storeWithReplaceOnPUTtrue PUT /stores-replacing/:id',
      'prototype.patchAttributes(data:object:storeWithReplaceOnPUTtrue):storeWithReplaceOnPUTtrue PATCH /stores-replacing/:id',
    ];

    expect(methods).to.include.members(expectedMethods);
  });
});

function formatReturns(m) {
  var returns = m.returns;
  if (!returns || returns.length === 0) {
    return '';
  }
  var type = returns[0].type;

  // handle anonymous type definitions, e.g
  // { arg: 'info', type: { count: 'number' } }
  if (typeof type === 'object' && !Array.isArray(type))
    type = 'object';

  return type ? ':' + type : '';
}

function formatMethod(m) {
  var arr = [];
  var endpoints = m.getEndpoints();
  for (var i = 0; i < endpoints.length; i++) {
    arr.push([
      m.name,
      '(',
      m.accepts.map(function(a) {
        return a.arg + ':' + a.type + (a.model ? ':' + a.model : '');
      }).join(','),
      ')',
      formatReturns(m),
      ' ',
      endpoints[i].verb,
      ' ',
      endpoints[i].fullPath,
    ].join(''));
  }
  return arr;
}

function findClass(name) {
  return app.handler('rest').adapter
    .getClasses()
    .filter(function(c) {
      return c.name === name;
    })[0];
}

function getFormattedMethodsExcludingRelations(methods) {
  return methods.filter(function(m) {
    return m.name.indexOf('__') === -1;
  })
  .map(function(m) {
    return formatMethod(m);
  })
  .reduce(function(p, c) {
    return p.concat(c);
  });
}

function getFormattedScopeMethods(methods) {
  return methods.filter(function(m) {
    return m.name.indexOf('__') === 0;
  })
  .map(function(m) {
    return formatMethod(m);
  })
  .reduce(function(p, c) {
    return p.concat(c);
  });
}

function getFormattedPrototypeMethods(methods) {
  return methods.filter(function(m) {
    return m.name.indexOf('prototype.__') === 0;
  })
  .map(function(m) {
    return formatMethod(m);
  })
  .reduce(function(p, c) {
    return p.concat(c);
  });
}
