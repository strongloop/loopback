// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const assert = require('assert');
const expect = require('./helpers/expect');
const loopback = require('../index');
const Scope = loopback.Scope;
const ACL = loopback.ACL;
const request = require('supertest');
const Promise = require('bluebird');
const supertest = require('supertest');
const Role = loopback.Role;
const RoleMapping = loopback.RoleMapping;
const User = loopback.User;
const async = require('async');

// Speed up the password hashing algorithm for tests
User.settings.saltWorkFactor = 4;

let ds = null;
let testModel;

describe('ACL model', function() {
  it('provides DEFAULT_SCOPE constant', () => {
    expect(ACL).to.have.property('DEFAULT_SCOPE', 'DEFAULT');
  });
});

describe('security scopes', function() {
  beforeEach(setupTestModels);

  it('should allow access to models for the given scope by wildcard', function(done) {
    Scope.create({name: 'userScope', description: 'access user information'},
      function(err, scope) {
        ACL.create({
          principalType: ACL.SCOPE, principalId: scope.id,
          model: 'User', property: ACL.ALL,
          accessType: ACL.ALL, permission: ACL.ALLOW,
        }, function(err, resource) {
          async.parallel([
            cb => Scope.checkPermission('userScope', 'User', ACL.ALL, ACL.ALL, cb),
            cb => Scope.checkPermission('userScope', 'User', 'name', ACL.ALL, cb),
            cb => Scope.checkPermission('userScope', 'User', 'name', ACL.READ, cb),
          ], (err) => {
            assert.ifError(err);
            done();
          });
        });
      });
  });

  it('should allow access to models for the given scope', function(done) {
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
            async.parallel([
              cb => Scope.checkPermission('testModelScope', 'testModel', ACL.ALL, ACL.ALL, cb),
              cb => Scope.checkPermission('testModelScope', 'testModel', 'name', ACL.ALL, cb),
              cb => Scope.checkPermission('testModelScope', 'testModel', 'name', ACL.READ, cb),
              cb => Scope.checkPermission('testModelScope', 'testModel', 'name', ACL.WRITE, cb),
            ], (err, perms) => {
              if (err) return done(err);
              assert.deepEqual(perms.map(p => p.permission), [
                ACL.DENY,
                ACL.DENY,
                ACL.ALLOW,
                ACL.DENY,
              ]);
              done();
            });
          });
        });
      });
  });
});

describe('security ACLs', function() {
  beforeEach(setupTestModels);

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

  it('supports ACL rules with a wildcard for models', function() {
    const A_USER_ID = 'a-test-user';

    // By default, access is allowed to all users
    return assertPermission(ACL.ALLOW, 'initial state')
      // An ACL rule applying to all models denies access to everybody
      .then(() => ACL.create({
        model: '*',
        property: '*',
        accessType: '*',
        principalType: 'ROLE',
        principalId: '$everyone',
        permission: 'DENY',
      }))
      .then(() => assertPermission(ACL.DENY, 'all denied'))
      // A rule for a specific model overrides the rule matching all models
      .then(() => ACL.create({
        model: testModel.modelName,
        property: '*',
        accessType: '*',
        principalType: ACL.USER,
        principalId: A_USER_ID,
        permission: ACL.ALLOW,
      }))
      .then(() => assertPermission(ACL.ALLOW, 'only a single model allowed'));

    function assertPermission(expectedPermission, msg) {
      return ACL.checkAccessForContext({
        principals: [{type: ACL.USER, id: A_USER_ID}],
        model: testModel.modelName,
        accessType: ACL.ALL,
      }).then(accessContext => {
        const actual = accessContext.isAllowed() ? ACL.ALLOW : ACL.DENY;
        expect(actual, msg).to.equal(expectedPermission);
      });
    }
  });

  it('supports checkAccessForContext() returning a promise', function() {
    const testModel = ds.createModel('testModel', {
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
    let acls = [
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
    const req = {
      model: 'account',
      property: 'find',
      accessType: 'WRITE',
    };

    acls = acls.map(function(a) { return new ACL(a); });

    const perm = ACL.resolvePermission(acls, req);
    // remove the registry from AccessRequest instance to ease asserting
    delete perm.registry;
    assert.deepEqual(perm, {model: 'account',
      property: 'find',
      accessType: 'WRITE',
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

  it('should order ACL entries based on the matching score even with wildcard req', function() {
    let acls = [
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
      }];
    const req = {
      model: 'account',
      property: '*',
      accessType: 'WRITE',
    };

    acls = acls.map(function(a) { return new ACL(a); });

    const perm = ACL.resolvePermission(acls, req);
    // remove the registry from AccessRequest instance to ease asserting.
    // Check the above test case for more info.
    delete perm.registry;
    assert.deepEqual(perm, {model: 'account',
      property: '*',
      accessType: 'WRITE',
      permission: 'ALLOW',
      methodNames: []});
  });

  it('should allow access to models for the given principal by wildcard', function(done) {
    // jscs:disable validateIndentation
    ACL.create({
      principalType: ACL.USER, principalId: 'u001', model: 'User', property: ACL.ALL,
      accessType: ACL.ALL, permission: ACL.ALLOW,
    }, function(err, acl) {
      ACL.create({
        principalType: ACL.USER, principalId: 'u001', model: 'User', property: ACL.ALL,
        accessType: ACL.READ, permission: ACL.DENY,
      }, function(err, acl) {
        async.parallel([
          cb => ACL.checkPermission(ACL.USER, 'u001', 'User', 'name', ACL.READ, cb),
          cb => ACL.checkPermission(ACL.USER, 'u001', 'User', 'name', ACL.ALL, cb),
        ], (err, perms) => {
          if (err) return done(err);
          assert.deepEqual(perms.map(p => p.permission), [
            ACL.DENY,
            ACL.DENY,
          ]);
          done();
        });
      });
    });
  });

  it('should allow access to models by exception', function(done) {
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
          async.parallel([
            cb => ACL.checkPermission(ACL.USER, 'u001', 'testModel', 'name', ACL.READ, cb),
            cb => ACL.checkPermission(ACL.USER, 'u001', 'testModel', ACL.ALL, ACL.READ, cb),
            cb => ACL.checkPermission(ACL.USER, 'u001', 'testModel', 'name', ACL.WRITE, cb),
            cb => ACL.checkPermission(ACL.USER, 'u001', 'testModel', 'name', ACL.ALL, cb),
            cb => ACL.checkPermission(ACL.USER, 'u002', 'testModel', 'name', ACL.WRITE, cb),
            cb => ACL.checkPermission(ACL.USER, 'u002', 'testModel', 'name', ACL.READ, cb),
          ], (err, perms) => {
            if (err) return done(err);
            assert.deepEqual(perms.map(p => p.permission), [
              ACL.ALLOW,
              ACL.ALLOW,
              ACL.DENY,
              ACL.DENY,
              ACL.ALLOW,
              ACL.ALLOW,
            ]);
            done();
          });
        });
      });
    });
  });

  it('should honor defaultPermission from the model', function(done) {
    const Customer = ds.createModel('Customer', {
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

    async.parallel([
      cb => ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.WRITE, cb),
      cb => ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.READ, cb),
      cb => ACL.checkPermission(ACL.USER, 'u002', 'Customer', 'name', ACL.WRITE, cb),
    ], (err, perms) => {
      if (err) return done(err);
      assert.deepEqual(perms.map(p => p.permission), [
        ACL.DENY,
        ACL.ALLOW,
        ACL.DENY,
      ]);
      done();
    });
  });

  it('should honor static ACLs from the model', function(done) {
    const Customer = ds.createModel('Customer', {
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

    async.parallel([
      cb => ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.WRITE, cb),
      cb => ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.READ, cb),
      cb => ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.ALL, cb),
      cb => ACL.checkPermission(ACL.USER, 'u002', 'Customer', 'name', ACL.READ, cb),
      cb => ACL.checkPermission(ACL.USER, 'u003', 'Customer', 'name', ACL.WRITE, cb),
    ], (err, perms) => {
      if (err) return done(err);
      assert.deepEqual(perms.map(p => p.permission), [
        ACL.DENY,
        ACL.ALLOW,
        ACL.ALLOW,
        ACL.ALLOW,
        ACL.DENY,
      ]);
      done();
    });
  });

  it('should filter static ACLs by model/property', function() {
    const Model1 = ds.createModel('Model1', {
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

    let staticACLs = ACL.getStaticACLs('Model1', 'name');
    assert(staticACLs.length === 3);

    staticACLs = ACL.getStaticACLs('Model1', 'findOne');
    assert(staticACLs.length === 2);

    staticACLs = ACL.getStaticACLs('Model1', 'findById');
    assert(staticACLs.length === 1);
    assert(staticACLs[0].property === 'findById');
  });

  it('should check access against LDL, ACL, and Role', function(done) {
    const log = function() {};

    // Create
    User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function(err, user) {
      log('User: ', user.toObject());

      const userId = user.id;

      // Define a model with static ACLs
      const Customer = ds.createModel('Customer', {
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

                async.parallel([
                  cb => {
                    ACL.checkAccessForContext({
                      principals: [
                        {type: ACL.USER, id: userId},
                      ],
                      model: 'Customer',
                      property: 'name',
                      accessType: ACL.READ,
                    }, function(err, access) {
                      assert.ifError(err);
                      assert.equal(access.permission, ACL.ALLOW);
                      cb();
                    });
                  },
                  cb => {
                    ACL.checkAccessForContext({
                      principals: [
                        {type: ACL.ROLE, id: Role.EVERYONE},
                      ],
                      model: 'Customer',
                      property: 'name',
                      accessType: ACL.READ,
                    }, function(err, access) {
                      assert.ifError(err);
                      assert.equal(access.permission, ACL.DENY);
                      cb();
                    });
                  }], done);
              });
            });
        });
      });
    });
  });
});

describe('access check', function() {
  it('should occur before other remote hooks', function(done) {
    const app = loopback();
    const MyTestModel = app.registry.createModel('MyTestModel');
    let checkAccessCalled = false;
    let beforeHookCalled = false;

    app.use(loopback.rest());
    app.set('remoting', {errorHandler: {debug: true, log: false}});
    app.enableAuth();
    app.dataSource('test', {connector: 'memory'});
    app.model(MyTestModel, {dataSource: 'test'});

    // fake / spy on the checkAccess method
    MyTestModel.checkAccess = function() {
      const cb = arguments[arguments.length - 1];
      checkAccessCalled = true;
      const allowed = true;
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
  let app, request, accessToken;
  let models = {};

  beforeEach(setupAppAndRequest);

  it('contains all authorized roles for a principal if query is allowed', function() {
    return createACLs('MyTestModel', [
      {permission: ACL.ALLOW, principalId: '$everyone'},
      {permission: ACL.ALLOW, principalId: '$authenticated'},
      {permission: ACL.ALLOW, principalId: 'myRole'},
    ])
      .then(makeAuthorizedHttpRequestOnMyTestModel)
      .then(function() {
        const ctx = models.MyTestModel.lastRemotingContext;
        expect(ctx.args.options.authorizedRoles).to.eql(
          {
            $everyone: true,
            $authenticated: true,
            myRole: true,
          },
        );
      });
  });

  it('does not contain any denied role even if query is allowed', function() {
    return createACLs('MyTestModel', [
      {permission: ACL.ALLOW, principalId: '$everyone'},
      {permission: ACL.DENY, principalId: '$authenticated'},
      {permission: ACL.ALLOW, principalId: 'myRole'},
    ])
      .then(makeAuthorizedHttpRequestOnMyTestModel)
      .then(function() {
        const ctx = models.MyTestModel.lastRemotingContext;
        expect(ctx.args.options.authorizedRoles).to.eql(
          {
            $everyone: true,
            myRole: true,
          },
        );
      });
  });

  it('honors default permission setting', function() {
    // default permission is set to DENY for MyTestModel
    models.MyTestModel.settings.defaultPermission = ACL.DENY;

    return createACLs('MyTestModel', [
      {permission: ACL.DEFAULT, principalId: '$everyone'},
      {permission: ACL.DENY, principalId: '$authenticated'},
      {permission: ACL.ALLOW, principalId: 'myRole'},
    ])
      .then(makeAuthorizedHttpRequestOnMyTestModel)
      .then(function() {
        const ctx = models.MyTestModel.lastRemotingContext;
        expect(ctx.args.options.authorizedRoles).to.eql(
        // '$everyone' is not expected as default permission is DENY
          {myRole: true},
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

    // Speed up the password hashing algorithm for tests
    models.User.settings.saltWorkFactor = 4;

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
  }

  function makeAuthorizedHttpRequestOnMyTestModel() {
    return request.get('/MyTestModels')
      .set('X-Access-Token', accessToken.id)
      .expect(200);
  }
});

function setupTestModels() {
  ds = this.ds = loopback.createDataSource({connector: loopback.Memory});
  testModel = loopback.PersistedModel.extend('testModel');
  ACL.attachTo(ds);
  Role.attachTo(ds);
  RoleMapping.attachTo(ds);
  User.attachTo(ds);
  Scope.attachTo(ds);
  testModel.attachTo(ds);
}
