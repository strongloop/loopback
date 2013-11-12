var assert = require('assert');
var loopback = require('../index');
var role = require('../lib/models/role');
var Role = role.Role;
var RoleMapping = role.RoleMapping;
var User = loopback.User;

describe('security models', function () {

  describe('roles', function () {

    it("should define role/role relations", function () {
      var ds = loopback.createDataSource({connector: loopback.Memory});
      Role.attachTo(ds);
      RoleMapping.attachTo(ds);

      Role.create({name: 'user'}, function (err, userRole) {
        Role.create({name: 'admin'}, function (err, adminRole) {
          userRole.principals.create({principalType: 'role', principalId: adminRole.id}, function (err, mapping) {
            Role.find(function(err, roles) {
              assert.equal(roles.length, 2);
            });
            RoleMapping.find(function(err, mappings) {
              assert.equal(mappings.length, 1);
            });
            userRole.principals(function(err, principals) {
              assert.equal(principals.length, 1);
            });
            userRole.roles(function(err, roles) {
              assert.equal(roles.length, 1);
            });
          });
        });
      });

    });

    it("should define role/user relations", function () {
      var ds = loopback.createDataSource({connector: loopback.Memory});
      User.attachTo(ds);
      Role.attachTo(ds);

      User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function (err, user) {
        console.log('User: ', user.id);
        Role.create({name: 'userRole'}, function (err, role) {
          role.principals.create({principalType: 'user', principalId: user.id}, function (err, p) {
            Role.find(console.log);
            role.principals(console.log);
            role.users(console.log);
          });
        });
      });

    });

  });
});



