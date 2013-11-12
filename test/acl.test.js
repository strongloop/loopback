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
    ScopeACL.attachTo(ds);

    // console.log(Scope.relations);

    Scope.create({name: 'user', description: 'access user information'}, function (err, scope) {
      // console.log(scope);
      scope.resources.create({model: 'user', property: ACL.ALL, accessType: ACL.ALL, permission: ACL.ALLOW},
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
    ScopeACL.attachTo(ds);

    // console.log(Scope.relations);

    Scope.create({name: 'user', description: 'access user information'}, function (err, scope) {
      // console.log(scope);
      scope.resources.create({model: 'user', property: 'name', accessType: ACL.READ, permission: ACL.ALLOW},
        function (err, resource) {
        // console.log(resource);
        Scope.checkPermission('user', 'user', ACL.ALL, ACL.ALL, checkResult);
        Scope.checkPermission('user', 'user', 'name', ACL.ALL, checkResult);
        Scope.checkPermission('user', 'user', 'name', ACL.READ, checkResult);
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

      ACL.checkPermission('user', 'u001', 'user', 'u001', ACL.READ, checkResult);

    });

  });

});



