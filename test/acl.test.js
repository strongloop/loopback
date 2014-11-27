var assert = require('assert');
var loopback = require('../index');
var Scope = loopback.Scope;
var ACL = loopback.ACL;
var Role = loopback.Role;
var RoleMapping = loopback.RoleMapping;
var User = loopback.User;
var testModel;

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
    Scope.create({name: 'userScope', description: 'access user information'}, function(err, scope) {
      ACL.create({principalType: ACL.SCOPE, principalId: scope.id, model: 'User', property: ACL.ALL,
          accessType: ACL.ALL, permission: ACL.ALLOW},
        function(err, resource) {
        Scope.checkPermission('userScope', 'User', ACL.ALL, ACL.ALL, checkResult);
        Scope.checkPermission('userScope', 'User', 'name', ACL.ALL, checkResult);
        Scope.checkPermission('userScope', 'User', 'name', ACL.READ, checkResult);
      });
    });

  });

  it('should allow access to models for the given scope', function() {
    Scope.create({name: 'testModelScope', description: 'access testModel information'}, function(err, scope) {
      ACL.create({principalType: ACL.SCOPE, principalId: scope.id,
          model: 'testModel', property: 'name', accessType: ACL.READ, permission: ACL.ALLOW},
        function(err, resource) {
          ACL.create({principalType: ACL.SCOPE, principalId: scope.id,
              model: 'testModel', property: 'name', accessType: ACL.WRITE, permission: ACL.DENY},
            function(err, resource) {
              // console.log(resource);
              Scope.checkPermission('testModelScope', 'testModel', ACL.ALL, ACL.ALL, function(err, perm) {
                assert(perm.permission === ACL.DENY); // because name.WRITE == DENY
              });
              Scope.checkPermission('testModelScope', 'testModel', 'name', ACL.ALL, function(err, perm) {
                assert(perm.permission === ACL.DENY); // because name.WRITE == DENY
              });
              Scope.checkPermission('testModelScope', 'testModel', 'name', ACL.READ, function(err, perm) {
                assert(perm.permission === ACL.ALLOW);
              });
              Scope.checkPermission('testModelScope', 'testModel', 'name', ACL.WRITE, function(err, perm) {
                assert(perm.permission === ACL.DENY);
              });
            });
        });
    });

  });

});

describe('security ACLs', function() {
  it('should order ACL entries based on the matching score', function() {
    var acls = [
      {
        'model': 'account',
        'accessType': '*',
        'permission': 'DENY',
        'principalType': 'ROLE',
        'principalId': '$everyone'
      },
      {
        'model': 'account',
        'accessType': '*',
        'permission': 'ALLOW',
        'principalType': 'ROLE',
        'principalId': '$owner'
      },
      {
        'model': 'account',
        'accessType': 'READ',
        'permission': 'ALLOW',
        'principalType': 'ROLE',
        'principalId': '$everyone'
      }];
    var req = {
      model: 'account',
      property: 'find',
      accessType: 'WRITE'
    };

    acls = acls.map(function(a) { return new ACL(a); });

    var perm = ACL.resolvePermission(acls, req);
    assert.deepEqual(perm, { model: 'account',
      property: 'find',
      accessType: 'WRITE',
      permission: 'ALLOW',
      methodNames: []});
  });

  it('should allow access to models for the given principal by wildcard', function() {
    ACL.create({principalType: ACL.USER, principalId: 'u001', model: 'User', property: ACL.ALL,
      accessType: ACL.ALL, permission: ACL.ALLOW}, function(err, acl) {

      ACL.create({principalType: ACL.USER, principalId: 'u001', model: 'User', property: ACL.ALL,
        accessType: ACL.READ, permission: ACL.DENY}, function(err, acl) {

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
    ACL.create({principalType: ACL.USER, principalId: 'u001', model: 'testModel', property: ACL.ALL,
      accessType: ACL.ALL, permission: ACL.DENY}, function(err, acl) {

      ACL.create({principalType: ACL.USER, principalId: 'u001', model: 'testModel', property: ACL.ALL,
        accessType: ACL.READ, permission: ACL.ALLOW}, function(err, acl) {

        ACL.checkPermission(ACL.USER, 'u001', 'testModel', 'name', ACL.READ, function(err, perm) {
          assert(perm.permission === ACL.ALLOW);
        });

        ACL.checkPermission(ACL.USER, 'u001', 'testModel', ACL.ALL, ACL.READ, function(err, perm) {
          assert(perm.permission === ACL.ALLOW);
        });

        ACL.checkPermission(ACL.USER, 'u001', 'testModel', 'name', ACL.WRITE, function(err, perm) {
          assert(perm.permission === ACL.DENY);
        });

        ACL.checkPermission(ACL.USER, 'u001', 'testModel', 'name', ACL.ALL, function(err, perm) {
          assert(perm.permission === ACL.DENY);
        });

      });

    });

  });

  it('should honor defaultPermission from the model', function() {
    var Customer = ds.createModel('Customer', {
      name: {
        type: String,
        acls: [
          {principalType: ACL.USER, principalId: 'u001', accessType: ACL.WRITE, permission: ACL.DENY},
          {principalType: ACL.USER, principalId: 'u001', accessType: ACL.ALL, permission: ACL.ALLOW}
        ]
      }
    }, {
      acls: [
        {principalType: ACL.USER, principalId: 'u001', accessType: ACL.ALL, permission: ACL.ALLOW}
      ]
    });

    Customer.settings.defaultPermission = ACL.DENY;

    ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.WRITE, function(err, perm) {
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
          {principalType: ACL.USER, principalId: 'u001', accessType: ACL.WRITE, permission: ACL.DENY},
          {principalType: ACL.USER, principalId: 'u001', accessType: ACL.ALL, permission: ACL.ALLOW}
        ]
      }
    }, {
      acls: [
        {principalType: ACL.USER, principalId: 'u001', accessType: ACL.ALL, permission: ACL.ALLOW}
      ]
    });

    /*
     Customer.settings.acls = [
     {principalType: ACL.USER, principalId: 'u001', accessType: ACL.ALL, permission: ACL.ALLOW}
     ];
     */

    ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.WRITE, function(err, perm) {
      assert(perm.permission === ACL.DENY);
    });

    ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.READ, function(err, perm) {
      assert(perm.permission === ACL.ALLOW);
    });

    ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.ALL, function(err, perm) {
      assert(perm.permission === ACL.ALLOW);
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
            accessType: ACL.ALL, permission: ACL.ALLOW}
        ]
      }
    }, {
      acls: [
        {principalType: ACL.USER, principalId: 'u001', property: 'name',
          accessType: ACL.ALL, permission: ACL.ALLOW},
        {principalType: ACL.USER, principalId: 'u002', property: 'findOne',
          accessType: ACL.ALL, permission: ACL.ALLOW}
      ]
    });

    var staticACLs = ACL.getStaticACLs('Model1', 'name');
    assert(staticACLs.length === 3);

    staticACLs = ACL.getStaticACLs('Model1', 'findOne');
    assert(staticACLs.length === 1);
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
            {principalType: ACL.USER, principalId: userId, accessType: ACL.WRITE, permission: ACL.DENY},
            {principalType: ACL.USER, principalId: userId, accessType: ACL.ALL, permission: ACL.ALLOW}
          ]
        }
      }, {
        acls: [
          {principalType: ACL.USER, principalId: userId, accessType: ACL.ALL, permission: ACL.ALLOW}
        ],
        defaultPermission: 'DENY'
      });

      ACL.create({principalType: ACL.USER, principalId: userId, model: 'Customer', property: ACL.ALL,
        accessType: ACL.ALL, permission: ACL.ALLOW}, function(err, acl) {

        log('ACL 1: ', acl.toObject());

        Role.create({name: 'MyRole'}, function(err, myRole) {
          log('Role: ', myRole.toObject());

          myRole.principals.create({principalType: RoleMapping.USER, principalId: userId}, function(err, p) {

            log('Principal added to role: ', p.toObject());

            ACL.create({principalType: ACL.ROLE, principalId: 'MyRole', model: 'Customer', property: ACL.ALL,
              accessType: ACL.READ, permission: ACL.DENY}, function(err, acl) {

              log('ACL 2: ', acl.toObject());

              ACL.checkAccessForContext({
                principals: [
                  {type: ACL.USER, id: userId}
                ],
                model: 'Customer',
                property: 'name',
                accessType: ACL.READ
              }, function(err, access) {
                assert(!err && access.permission === ACL.ALLOW);
              });

              ACL.checkAccessForContext({
                principals: [
                  {type: ACL.ROLE, id: Role.EVERYONE}
                ],
                model: 'Customer',
                property: 'name',
                accessType: ACL.READ
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
