// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var assert = require('assert');
var expect = require('./helpers/expect');
var loopback = require('../index');
var Scope = loopback.Scope;
var ACL = loopback.ACL;
var request = require('supertest');
var Promise = require('bluebird');
var supertest = require('supertest');
var Role = loopback.Role;
var RoleMapping = loopback.RoleMapping;
var User = loopback.User;
var testModel;

// Speed up the password hashing algorithm for tests
User.settings.saltWorkFactor = 4;

function checkResult(err, result) {
  // console.log(err, result);
  assert(!err);
}

var ds = null;
before(function() {
  ds = loopback.createDataSource({connector: loopback.Memory});
});

describe('security scopes', function() {
  beforeEach(function() {
    var ds = this.ds = loopback.createDataSource({connector: loopback.Memory});
    testModel = loopback.PersistedModel.extend('testModel');
    ACL.attachTo(ds);
    Role.attachTo(ds);
    RoleMapping.attachTo(ds);
    User.attachTo(ds);
    Scope.attachTo(ds);
    testModel.attachTo(ds);
  });

  it('should allow access to models for the given scope by wildcard', function() {
    Scope.create({name: 'userScope', description: 'access user information'},
    function(err, scope) {
      ACL.create({
        principalType: ACL.SCOPE, principalId: scope.id,
        model: 'User', property: ACL.ALL,
        accessType: ACL.ALL, permission: ACL.ALLOW,
      }, function(err, resource) {
        Scope.checkPermission('userScope', 'User', ACL.ALL, ACL.ALL, checkResult);
        Scope.checkPermission('userScope', 'User', 'name', ACL.ALL, checkResult);
        Scope.checkPermission('userScope', 'User', 'name', ACL.READ, checkResult);
      });
    });
  });

  it('should allow access to models for the given scope', function() {
    Scope.create({name: 'testModelScope', description: 'access testModel information'},
    function(err, scope) {
      ACL.create({
        principalType: ACL.SCOPE, principalId: scope.id,
        model: 'testModel', property: 'name',
        accessType: ACL.READ, permission: ACL.ALLOW,
      }, function(err, resource) {
        ACL.create({principalType: ACL.SCOPE, principalId: scope.id,
          model: 'testModel', property: 'name',
          accessType: ACL.WRITE, permission: ACL.DENY,
        }, function(err, resource) {
          // console.log(resource);
          Scope.checkPermission('testModelScope', 'testModel', ACL.ALL, ACL.ALL,
            function(err, perm) {
              assert(perm.permission === ACL.DENY); // because name.WRITE == DENY
            });
          Scope.checkPermission('testModelScope', 'testModel', 'name', ACL.ALL,
            function(err, perm) {
              assert(perm.permission === ACL.DENY); // because name.WRITE == DENY
            });
          Scope.checkPermission('testModelScope', 'testModel', 'name', ACL.READ,
            function(err, perm) {
              assert(perm.permission === ACL.ALLOW);
            });
          Scope.checkPermission('testModelScope', 'testModel', 'name', ACL.WRITE,
            function(err, perm) {
              assert(perm.permission === ACL.DENY);
            });
        });
      });
    });
  });
});

describe('security ACLs', function() {
  it('supports checkPermission() returning a promise', function() {
    return ACL.create({
      principalType: ACL.USER,
      principalId: 'u001',
      model: 'testModel',
      property: ACL.ALL,
      accessType: ACL.ALL,
      permission: ACL.ALLOW,
    })
    .then(function() {
      return ACL.checkPermission(ACL.USER, 'u001', 'testModel', 'name', ACL.ALL);
    })
    .then(function(access) {
      assert(access.permission === ACL.ALLOW);
    });
  });

  it('supports checkAccessForContext() returning a promise', function() {
    var testModel = ds.createModel('testModel', {
      acls: [
        {principalType: ACL.USER, principalId: 'u001',
          accessType: ACL.ALL, permission: ACL.ALLOW},
      ],
    });

    return ACL.checkAccessForContext({
      principals: [{type: ACL.USER, id: 'u001'}],
      model: 'testModel',
      accessType: ACL.ALL,
    })
    .then(function(access) {
      assert(access.permission === ACL.ALLOW);
    });
  });

  it('should order ACL entries based on the matching score', function() {
    var acls = [
      {
        'model': 'account',
        'accessType': '*',
        'permission': 'DENY',
        'principalType': 'ROLE',
        'principalId': '$everyone',
      },
      {
        'model': 'account',
        'accessType': '*',
        'permission': 'ALLOW',
        'principalType': 'ROLE',
        'principalId': '$owner',
      },
      {
        'model': 'account',
        'accessType': 'READ',
        'permission': 'ALLOW',
        'principalType': 'ROLE',
        'principalId': '$everyone',
      }];
    var req = {
      model: 'account',
      property: 'find',
      accessType: 'WRITE',
    };

    acls = acls.map(function(a) { return new ACL(a); });

    var perm = ACL.resolvePermission(acls, req);
    // remove the registry from AccessRequest instance to ease asserting
    delete perm.registry;
    assert.deepEqual(perm, {model: 'account',
      property: 'find',
      accessType: 'WRITE',
      accessScope: undefined,
      permission: 'ALLOW',
      methodNames: []});

    // NOTE: when fixed in chaijs, use this implement rather than modifying
    // the resolved access request
    //
    // expect(perm).to.deep.include({
    //   model: 'account',
    //   property: 'find',
    //   accessType: 'WRITE',
    //   permission: 'ALLOW',
    //   methodNames: [],
    // });
  });

  it('should allow access to models for the given principal by wildcard', function() {
    // jscs:disable validateIndentation
    ACL.create({
      principalType: ACL.USER, principalId: 'u001', model: 'User', property: ACL.ALL,
      accessType: ACL.ALL, permission: ACL.ALLOW,
    }, function(err, acl) {
      ACL.create({
        principalType: ACL.USER, principalId: 'u001', model: 'User', property: ACL.ALL,
        accessType: ACL.READ, permission: ACL.DENY,
      }, function(err, acl) {
        ACL.checkPermission(ACL.USER, 'u001', 'User', 'name', ACL.READ, function(err, perm) {
          assert(perm.permission === ACL.DENY);
        });

        ACL.checkPermission(ACL.USER, 'u001', 'User', 'name', ACL.ALL, function(err, perm) {
          assert(perm.permission === ACL.DENY);
        });
      });
    });
  });

  it('should allow access to models by exception', function() {
    ACL.create({
      principalType: ACL.USER, principalId: 'u001', model: 'testModel', property: ACL.ALL,
      accessType: ACL.ALL, permission: ACL.DENY,
    }, function(err, acl) {
      ACL.create({
        principalType: ACL.USER, principalId: 'u001', model: 'testModel', property: ACL.ALL,
        accessType: ACL.READ, permission: ACL.ALLOW,
      }, function(err, acl) {
        ACL.create({
          principalType: ACL.USER, principalId: 'u002', model: 'testModel', property: ACL.ALL,
          accessType: ACL.EXECUTE, permission: ACL.ALLOW,
        }, function(err, acl) {
          ACL.checkPermission(ACL.USER, 'u001', 'testModel', 'name', ACL.READ,
          function(err, perm) {
            assert(perm.permission === ACL.ALLOW);
          });

          ACL.checkPermission(ACL.USER, 'u001', 'testModel', ACL.ALL, ACL.READ,
          function(err, perm) {
            assert(perm.permission === ACL.ALLOW);
          });

          ACL.checkPermission(ACL.USER, 'u001', 'testModel', 'name', ACL.WRITE,
          function(err, perm) {
            assert(perm.permission === ACL.DENY);
          });

          ACL.checkPermission(ACL.USER, 'u001', 'testModel', 'name', ACL.ALL,
          function(err, perm) {
            assert(perm.permission === ACL.DENY);
          });

          ACL.checkPermission(ACL.USER, 'u002', 'testModel', 'name', ACL.WRITE,
          function(err, perm) {
            assert(perm.permission === ACL.ALLOW);
          });

          ACL.checkPermission(ACL.USER, 'u002', 'testModel', 'name', ACL.READ,
          function(err, perm) {
            assert(perm.permission === ACL.ALLOW);
          });
        });
      });
    });
  });

  it('should honor defaultPermission from the model', function() {
    var Customer = ds.createModel('Customer', {
      name: {
        type: String,
        acls: [
          {principalType: ACL.USER, principalId: 'u001',
            accessType: ACL.WRITE, permission: ACL.DENY},
          {principalType: ACL.USER, principalId: 'u001',
            accessType: ACL.ALL, permission: ACL.ALLOW},
        ],
      },
    }, {
      acls: [
        {principalType: ACL.USER, principalId: 'u001',
          accessType: ACL.ALL, permission: ACL.ALLOW},
      ],
    });

    // ACL default permission is to DENY for model Customer
    Customer.settings.defaultPermission = ACL.DENY;

    ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.WRITE,
    function(err, perm) {
      assert(perm.permission === ACL.DENY);
    });

    ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.READ, function(err, perm) {
      assert(perm.permission === ACL.ALLOW);
    });

    ACL.checkPermission(ACL.USER, 'u002', 'Customer', 'name', ACL.WRITE, function(err, perm) {
      assert(perm.permission === ACL.DENY);
    });
  });

  it('should honor static ACLs from the model', function() {
    var Customer = ds.createModel('Customer', {
      name: {
        type: String,
        acls: [
          {principalType: ACL.USER, principalId: 'u001',
            accessType: ACL.WRITE, permission: ACL.DENY},
          {principalType: ACL.USER, principalId: 'u001',
            accessType: ACL.ALL, permission: ACL.ALLOW},
        ],
      },
    }, {
      acls: [
        {principalType: ACL.USER, principalId: 'u001',
          accessType: ACL.ALL, permission: ACL.ALLOW},
        {principalType: ACL.USER, principalId: 'u002',
          accessType: ACL.EXECUTE, permission: ACL.ALLOW},
        {principalType: ACL.USER, principalId: 'u003',
          accessType: ACL.EXECUTE, permission: ACL.DENY},
      ],
    });

    /*
     Customer.settings.acls = [
     {principalType: ACL.USER, principalId: 'u001', accessType: ACL.ALL, permission: ACL.ALLOW}
     ];
     */

    ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.WRITE,
    function(err, perm) {
      assert(perm.permission === ACL.DENY);
    });

    ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.READ,
    function(err, perm) {
      assert(perm.permission === ACL.ALLOW);
    });

    ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.ALL,
    function(err, perm) {
      assert(perm.permission === ACL.ALLOW);
    });

    ACL.checkPermission(ACL.USER, 'u002', 'Customer', 'name', ACL.READ,
    function(err, perm) {
      assert(perm.permission === ACL.ALLOW);
    });

    ACL.checkPermission(ACL.USER, 'u003', 'Customer', 'name', ACL.WRITE,
    function(err, perm) {
      assert(perm.permission === ACL.DENY);
    });
  });

  it('should filter static ACLs by model/property', function() {
    var Model1 = ds.createModel('Model1', {
      name: {
        type: String,
        acls: [
          {principalType: ACL.USER, principalId: 'u001',
            accessType: ACL.WRITE, permission: ACL.DENY},
          {principalType: ACL.USER, principalId: 'u001',
            accessType: ACL.ALL, permission: ACL.ALLOW},
        ],
      },
    }, {
      acls: [
        {principalType: ACL.USER, principalId: 'u001', property: 'name',
          accessType: ACL.ALL, permission: ACL.ALLOW},
        {principalType: ACL.USER, principalId: 'u002', property: 'findOne',
          accessType: ACL.ALL, permission: ACL.ALLOW},
        {principalType: ACL.USER, principalId: 'u003', property: ['findOne', 'findById'],
          accessType: ACL.ALL, permission: ACL.ALLOW},
      ],
    });

    var staticACLs = ACL.getStaticACLs('Model1', 'name');
    assert(staticACLs.length === 3);

    staticACLs = ACL.getStaticACLs('Model1', 'findOne');
    assert(staticACLs.length === 2);

    staticACLs = ACL.getStaticACLs('Model1', 'findById');
    assert(staticACLs.length === 1);
    assert(staticACLs[0].property === 'findById');
  });

  it('should check access against LDL, ACL, and Role', function() {
    // var log = console.log;
    var log = function() {};

    // Create
    User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function(err, user) {
      log('User: ', user.toObject());

      var userId = user.id;

      // Define a model with static ACLs
      var Customer = ds.createModel('Customer', {
        name: {
          type: String,
          acls: [
            {principalType: ACL.USER, principalId: userId,
              accessType: ACL.WRITE, permission: ACL.DENY},
            {principalType: ACL.USER, principalId: userId,
              accessType: ACL.ALL, permission: ACL.ALLOW},
          ],
        },
      }, {
        acls: [
          {principalType: ACL.USER, principalId: userId,
            accessType: ACL.ALL, permission: ACL.ALLOW},
        ],
        defaultPermission: 'DENY',
      });

      ACL.create({
        principalType: ACL.USER, principalId: userId,
        model: 'Customer', property: ACL.ALL,
        accessType: ACL.ALL, permission: ACL.ALLOW,
      }, function(err, acl) {
        log('ACL 1: ', acl.toObject());

        Role.create({name: 'MyRole'}, function(err, myRole) {
          log('Role: ', myRole.toObject());

          myRole.principals.create({principalType: RoleMapping.USER, principalId: userId},
          function(err, p) {
            log('Principal added to role: ', p.toObject());

            ACL.create({
              principalType: ACL.ROLE, principalId: 'MyRole',
              model: 'Customer', property: ACL.ALL,
              accessType: ACL.READ, permission: ACL.DENY,
            }, function(err, acl) {
              log('ACL 2: ', acl.toObject());

              ACL.checkAccessForContext({
                principals: [
                  {type: ACL.USER, id: userId},
                ],
                model: 'Customer',
                property: 'name',
                accessType: ACL.READ,
              }, function(err, access) {
                assert(!err && access.permission === ACL.ALLOW);
              });

              ACL.checkAccessForContext({
                principals: [
                  {type: ACL.ROLE, id: Role.EVERYONE},
                ],
                model: 'Customer',
                property: 'name',
                accessType: ACL.READ,
              }, function(err, access) {
                assert(!err && access.permission === ACL.DENY);
              });
            });
          });
        });
      });
    });
  });
});

describe('access check', function() {
  it('should occur before other remote hooks', function(done) {
    var app = loopback();
    var MyTestModel = app.registry.createModel('MyTestModel');
    var checkAccessCalled = false;
    var beforeHookCalled = false;

    app.use(loopback.rest());
    app.set('remoting', {errorHandler: {debug: true, log: false}});
    app.enableAuth();
    app.dataSource('test', {connector: 'memory'});
    app.model(MyTestModel, {dataSource: 'test'});

    // fake / spy on the checkAccess method
    MyTestModel.checkAccess = function() {
      var cb = arguments[arguments.length - 1];
      checkAccessCalled = true;
      var allowed = true;
      cb(null, allowed);
    };

    MyTestModel.beforeRemote('find', function(ctx, next) {
      // ensure this is called after checkAccess
      if (!checkAccessCalled) return done(new Error('incorrect order'));

      beforeHookCalled = true;

      next();
    });

    request(app)
      .get('/MyTestModels')
      .end(function(err, result) {
        assert(beforeHookCalled, 'the before hook should be called');
        assert(checkAccessCalled, 'checkAccess should have been called');

        done();
      });
  });
});

describe('authorized roles propagation in RemotingContext', function() {
  var app, request, accessToken;
  var models = {};

  beforeEach(setupAppAndRequest);

  it('contains all authorized roles for a principal if query is allowed', function() {
    return createACLs('MyTestModel', [
      {permission: ACL.ALLOW, principalId: '$everyone'},
      {permission: ACL.ALLOW, principalId: '$authenticated'},
      {permission: ACL.ALLOW, principalId: 'myRole'},
    ])
    .then(makeAuthorizedHttpRequestOnMyTestModel)
    .then(function() {
      var ctx = models.MyTestModel.lastRemotingContext;
      expect(ctx.args.options.authorizedRoles).to.eql(
        {
          $everyone: true,
          $authenticated: true,
          myRole: true,
        }
      );
    });
  });

  it('does not contain any denied role even if query is allowed', function() {
    return createACLs('MyTestModel', [
      {permission: ACL.ALLOW, principalId: '$everyone'},
      {permission: ACL.DENY,  principalId: '$authenticated'},
      {permission: ACL.ALLOW, principalId: 'myRole'},
    ])
    .then(makeAuthorizedHttpRequestOnMyTestModel)
    .then(function() {
      var ctx = models.MyTestModel.lastRemotingContext;
      expect(ctx.args.options.authorizedRoles).to.eql(
        {
          $everyone: true,
          myRole: true,
        }
      );
    });
  });

  it('honors default permission setting', function() {
    // default permission is set to DENY for MyTestModel
    models.MyTestModel.settings.defaultPermission = ACL.DENY;

    return createACLs('MyTestModel', [
      {permission: ACL.DEFAULT, principalId: '$everyone'},
      {permission: ACL.DENY,    principalId: '$authenticated'},
      {permission: ACL.ALLOW,   principalId: 'myRole'},
    ])
    .then(makeAuthorizedHttpRequestOnMyTestModel)
    .then(function() {
      var ctx = models.MyTestModel.lastRemotingContext;
      expect(ctx.args.options.authorizedRoles).to.eql(
        // '$everyone' is not expected as default permission is DENY
        {myRole: true}
      );
    });
  });

  // helpers
  function setupAppAndRequest() {
    app = loopback({localRegistry: true, loadBuiltinModels: true});
    app.use(loopback.rest());
    app.set('remoting', {errorHandler: {debug: true, log: true}});
    app.dataSource('db', {connector: 'memory'});
    request = supertest(app);

    app.enableAuth({dataSource: 'db'});
    models = app.models;

    // creating a custom model
    const MyTestModel = app.registry.createModel('MyTestModel');
    app.model(MyTestModel, {dataSource: 'db'});

    // capturing the value of the last remoting context
    models.MyTestModel.beforeRemote('find', function(ctx, unused, next) {
      models.MyTestModel.lastRemotingContext = ctx;
      next();
    });

    // creating a user, a role and a rolemapping binding that user with that role
    return Promise.all([
      models.User.create({username: 'myUser', email: 'myuser@example.com', password: 'pass'}),
      models.Role.create({name: 'myRole'}),
    ])
    .spread(function(myUser, myRole) {
      return Promise.all([
        myRole.principals.create({principalType: 'USER', principalId: myUser.id}),
        models.User.login({username: 'myUser', password: 'pass'}),
      ]);
    })
    .spread(function(role, token) {
      accessToken = token;
    });
  }

  function createACLs(model, acls) {
    acls = acls.map(function(acl) {
      return models.ACL.create({
        principalType: acl.principalType || ACL.ROLE,
        principalId: acl.principalId,
        model: acl.model || model,
        property: acl.property || ACL.ALL,
        accessType: acl.accessType || ACL.ALL,
        permission: acl.permission,
      });
    });
    return Promise.all(acls);
  };

  function makeAuthorizedHttpRequestOnMyTestModel() {
    return request.get('/MyTestModels')
      .set('X-Access-Token', accessToken.id)
      .expect(200);
  }
});
