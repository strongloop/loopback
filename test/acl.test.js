var assert = require('assert');
var loopback = require('../index');
var acl = require('../lib/models/acl');
var Scope = acl.Scope;
var ACL = acl.ACL;
var ScopeACL = acl.ScopeACL;
var User = loopback.User;

describe('security scopes', function () {

  it("should allow access to models for the given scope by wildcard", function () {
    var ds = loopback.createDataSource({connector: loopback.Memory});
    Scope.attachTo(ds);
    ScopeACL.attachTo(ds);

    // console.log(Scope.relations);

    Scope.create({name: 'user', description: 'access user information'}, function (err, scope) {
      // console.log(scope);
      scope.resources.create({model: 'user', property: '*', accessType: '*', permission: 'Allow'}, function (err, resource) {
        // console.log(resource);
        Scope.checkPermission('user', 'user', '*', '*', console.log);
        Scope.checkPermission('user', 'user', 'name', '*', console.log);
        Scope.checkPermission('user', 'user', 'name', 'Read', console.log);
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
      scope.resources.create({model: 'user', property: 'name', accessType: 'Read', permission: 'Allow'}, function (err, resource) {
        // console.log(resource);
        Scope.checkPermission('user', 'user', '*', '*', console.log);
        Scope.checkPermission('user', 'user', 'name', '*', console.log);
        Scope.checkPermission('user', 'user', 'name', 'Read', console.log);
      });
    });

  });

});

describe('security ACLs', function () {

  it("should allow access to models for the given principal by wildcard", function () {
    var ds = loopback.createDataSource({connector: loopback.Memory});
    ACL.attachTo(ds);

    // console.log(Scope.relations);

    ACL.create({principalType: 'user', principalId: 'u001', model: 'user', property: '*', accessType: '*', permission: 'Allow'}, function (err, acl) {

      ACL.checkPermission('user', 'u001', 'user', 'u001', 'Read', console.log);

    });

  });

});



