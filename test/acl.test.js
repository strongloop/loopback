var assert = require('assert');
var loopback = require('../index');
var acl = require('../lib/models/acl');
var Scope = acl.Scope;
var ACL = acl.ACL;
var ScopeACL = acl.ScopeACL;
var User = loopback.User;

function checkResult(err, result) {
  // console.log(err, result);
  assert(!err);
}

describe('security scopes', function () {

  it("should allow access to models for the given scope by wildcard", function () {
    var ds = loopback.createDataSource({connector: loopback.Memory});
    Scope.attachTo(ds);
    ACL.attachTo(ds);

    // console.log(Scope.relations);

    Scope.create({name: 'user', description: 'access user information'}, function (err, scope) {
      // console.log(scope);
      ACL.create({principalType: ACL.SCOPE, principalId: scope.id, model: 'user', property: ACL.ALL,
          accessType: ACL.ALL, permission: ACL.ALLOW},
        function (err, resource) {
        // console.log(resource);
        Scope.checkPermission('user', 'user', ACL.ALL, ACL.ALL, checkResult);
        Scope.checkPermission('user', 'user', 'name', ACL.ALL, checkResult);
        Scope.checkPermission('user', 'user', 'name', ACL.READ, checkResult);
      });
    });

  });

  it("should allow access to models for the given scope", function () {
    var ds = loopback.createDataSource({connector: loopback.Memory});
    Scope.attachTo(ds);
    ACL.attachTo(ds);

    // console.log(Scope.relations);

    Scope.create({name: 'user', description: 'access user information'}, function (err, scope) {
      // console.log(scope);
      ACL.create({principalType: ACL.SCOPE, principalId: scope.id,
          model: 'user', property: 'name', accessType: ACL.READ, permission: ACL.ALLOW},
        function (err, resource) {
          ACL.create({principalType: ACL.SCOPE, principalId: scope.id,
              model: 'user', property: 'name', accessType: ACL.WRITE, permission: ACL.DENY},
            function (err, resource) {
              // console.log(resource);
              Scope.checkPermission('user', 'user', ACL.ALL, ACL.ALL, function (err, perm) {
                assert(perm.permission === ACL.DENY); // because name.WRITE == DENY
              });
              Scope.checkPermission('user', 'user', 'name', ACL.ALL, function (err, perm) {
                assert(perm.permission === ACL.DENY); // because name.WRITE == DENY
              });
              Scope.checkPermission('user', 'user', 'name', ACL.READ, function (err, perm) {
                assert(perm.permission === ACL.ALLOW);
              });
              Scope.checkPermission('user', 'user', 'name', ACL.WRITE, function (err, perm) {
                assert(perm.permission === ACL.DENY);
              });
            });
        });
    });

  });

});

describe('security ACLs', function () {

  it("should allow access to models for the given principal by wildcard", function () {
    var ds = loopback.createDataSource({connector: loopback.Memory});
    ACL.attachTo(ds);

    ACL.create({principalType: 'user', principalId: 'u001', model: 'user', property: ACL.ALL,
      accessType: ACL.ALL, permission: ACL.ALLOW}, function (err, acl) {

      ACL.create({principalType: 'user', principalId: 'u001', model: 'user', property: ACL.ALL,
        accessType: ACL.READ, permission: ACL.DENY}, function (err, acl) {

        ACL.checkPermission('user', 'u001', 'user', 'name', ACL.READ, function (err, perm) {
          assert(perm.permission === ACL.DENY);
        });

        ACL.checkPermission('user', 'u001', 'user', 'name', ACL.ALL, function (err, perm) {
          assert(perm.permission === ACL.DENY);
        });

      });

    });

  });

});



