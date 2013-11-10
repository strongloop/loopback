var assert = require('assert');
var loopback = require('../index');
var Role = require('../lib/models/role');
var User = loopback.User;

describe('security models', function () {

  describe('roles', function () {

    it("Defines role/role relations", function () {
      var ds = loopback.createDataSource({connector: loopback.Memory});
      Role.attachTo(ds);

      Role.create({name: 'user'}, function (err, role) {
        role.roles.create({name: 'admin'}, function (err, role2) {
          Role.find(console.log);
          role.roles(console.log);
        });
      });

    });

    it("Defines role/user relations", function () {
      var ds = loopback.createDataSource({connector: loopback.Memory});
      User.attachTo(ds);
      Role.attachTo(ds);

      Role.create({name: 'user'}, function (err, role) {
        role.users.create({name: 'Raymond'}, function (err, user) {
          console.log('User: ', user);
          Role.find(console.log);
          role.users(console.log);
        });
      });

    });
  });
});



