var assert = require('assert');
var loopback = require('../index');
var role = require('../lib/models/role');
var Role = role.Role;
var RoleMapping = role.RoleMapping;
var User = loopback.User;

function checkResult(err, result) {
  // console.log(err, result);
  assert(!err);
}

describe('role model', function () {

  it("should define role/role relations", function () {
    var ds = loopback.createDataSource({connector: 'memory'});
    Role.attachTo(ds);
    RoleMapping.attachTo(ds);

    Role.create({name: 'user'}, function (err, userRole) {
      Role.create({name: 'admin'}, function (err, adminRole) {
        userRole.principals.create({principalType: RoleMapping.ROLE, principalId: adminRole.id}, function (err, mapping) {
          Role.find(function (err, roles) {
            assert.equal(roles.length, 2);
          });
          RoleMapping.find(function (err, mappings) {
            assert.equal(mappings.length, 1);
            assert.equal(mappings[0].principalType, RoleMapping.ROLE);
            assert.equal(mappings[0].principalId, adminRole.id);
          });
          userRole.principals(function (err, principals) {
            assert.equal(principals.length, 1);
          });
          userRole.roles(function (err, roles) {
            assert.equal(roles.length, 1);
          });
        });
      });
    });

  });

  it("should define role/user relations", function () {
    var ds = loopback.createDataSource({connector: 'memory'});
    User.attachTo(ds);
    Role.attachTo(ds);
    RoleMapping.attachTo(ds);

    User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function (err, user) {
      // console.log('User: ', user.id);
      Role.create({name: 'userRole'}, function (err, role) {
        role.principals.create({principalType: RoleMapping.USER, principalId: user.id}, function (err, p) {
          Role.find(function(err, roles) {
            assert(!err);
            assert.equal(roles.length, 1);
            assert.equal(roles[0].name, 'userRole');
          });
          role.principals(function(err, principals) {
            assert(!err);
            // console.log(principals);
            assert.equal(principals.length, 1);
            assert.equal(principals[0].principalType, RoleMapping.USER);
            assert.equal(principals[0].principalId, user.id);
          });
          role.users(function(err, users) {
            assert(!err);
            assert.equal(users.length, 1);
            assert.equal(users[0].principalType, RoleMapping.USER);
            assert.equal(users[0].principalId, user.id);
          });
        });
      });
    });

  });

  it("should support getRoles() and isInRole()", function () {
    var ds = loopback.createDataSource({connector: 'memory'});
    User.attachTo(ds);
    Role.attachTo(ds);
    RoleMapping.attachTo(ds);

    User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function (err, user) {
      // console.log('User: ', user.id);
      Role.create({name: 'userRole'}, function (err, role) {
        role.principals.create({principalType: RoleMapping.USER, principalId: user.id}, function (err, p) {
          // Role.find(console.log);
          // role.principals(console.log);
          Role.isInRole('userRole', RoleMapping.USER, user.id, function(err, exists) {
            assert(!err && exists === true);
          });

          Role.isInRole('userRole', RoleMapping.APP, user.id, function(err, exists) {
            assert(!err && exists === false);
          });

          Role.isInRole('userRole', RoleMapping.USER, 100, function(err, exists) {
            assert(!err && exists === false);
          });

          Role.getRoles(RoleMapping.USER, user.id, function(err, roles) {
            assert.equal(roles.length, 1);
            assert.equal(roles[0], role.id);
          });
          Role.getRoles(RoleMapping.APP, user.id, function(err, roles) {
            assert.equal(roles.length, 0);
          });
          Role.getRoles(RoleMapping.USER, 100, function(err, roles) {
            assert.equal(roles.length, 0);
          });

        });
      });
    });

  });

});




