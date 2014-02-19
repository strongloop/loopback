var assert = require('assert');
var loopback = require('../index');
var role = require('../lib/models/role');
var Role = role.Role;
var RoleMapping = role.RoleMapping;
var User = loopback.User;
var ACL = require('../lib/models/acl');

function checkResult(err, result) {
  // console.log(err, result);
  assert(!err);
}

describe('role model', function () {
  var ds;

  beforeEach(function() {
    ds = loopback.createDataSource({connector: 'memory'});
    // Re-attach the models so that they can have isolated store to avoid
    // pollutions from other tests
    User.attachTo(ds);
    Role.attachTo(ds);
    RoleMapping.attachTo(ds);
  });

  it("should define role/role relations", function () {
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

    User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function (err, user) {
      // console.log('User: ', user.id);
      Role.create({name: 'userRole'}, function (err, role) {
        role.principals.create({principalType: RoleMapping.USER, principalId: user.id}, function (err, p) {
          Role.find(function (err, roles) {
            assert(!err);
            assert.equal(roles.length, 1);
            assert.equal(roles[0].name, 'userRole');
          });
          role.principals(function (err, principals) {
            assert(!err);
            // console.log(principals);
            assert.equal(principals.length, 1);
            assert.equal(principals[0].principalType, RoleMapping.USER);
            assert.equal(principals[0].principalId, user.id);
          });
          role.users(function (err, users) {
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
    User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function (err, user) {
      // console.log('User: ', user.id);
      Role.create({name: 'userRole'}, function (err, role) {
        role.principals.create({principalType: RoleMapping.USER, principalId: user.id}, function (err, p) {
          // Role.find(console.log);
          // role.principals(console.log);
          Role.isInRole('userRole', {principalType: RoleMapping.USER, principalId: user.id}, function (err, exists) {
            assert(!err && exists === true);
          });

          Role.isInRole('userRole', {principalType: RoleMapping.APP, principalId: user.id}, function (err, exists) {
            assert(!err && exists === false);
          });

          Role.isInRole('userRole', {principalType: RoleMapping.USER, principalId: 100}, function (err, exists) {
            assert(!err && exists === false);
          });

          Role.getRoles({principalType: RoleMapping.USER, principalId: user.id}, function (err, roles) {
            assert.equal(roles.length, 3); // everyone, authenticated, userRole
            assert(roles.indexOf(role.id) >=0);
            assert(roles.indexOf(Role.EVERYONE) >=0);
            assert(roles.indexOf(Role.AUTHENTICATED) >=0);
          });
          Role.getRoles({principalType: RoleMapping.APP, principalId: user.id}, function (err, roles) {
            assert.equal(roles.length, 2);
            assert(roles.indexOf(Role.EVERYONE) >=0);
            assert(roles.indexOf(Role.AUTHENTICATED) >=0);
          });
          Role.getRoles({principalType: RoleMapping.USER, principalId: 100}, function (err, roles) {
            assert.equal(roles.length, 2);
            assert(roles.indexOf(Role.EVERYONE) >=0);
            assert(roles.indexOf(Role.AUTHENTICATED) >=0);
          });
          Role.getRoles({principalType: RoleMapping.USER, principalId: null}, function (err, roles) {
            assert.equal(roles.length, 2);
            assert(roles.indexOf(Role.EVERYONE) >=0);
            assert(roles.indexOf(Role.UNAUTHENTICATED) >=0);
          });
        });
      });
    });

  });

  it("should support owner role resolver", function () {

    var Album = ds.createModel('Album', {
      name: String,
      userId: Number
    }, {
      relations: {
        user: {
          type: 'belongsTo',
          model: 'User',
          foreignKey: 'userId'
        }
      }
    });

    User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function (err, user) {
      Role.isInRole(Role.AUTHENTICATED, {principalType: ACL.USER, principalId: user.id}, function (err, yes) {
        assert(!err && yes);
      });
      Role.isInRole(Role.AUTHENTICATED, {principalType: ACL.USER, principalId: null}, function (err, yes) {
        assert(!err && !yes);
      });

      Role.isInRole(Role.UNAUTHENTICATED, {principalType: ACL.USER, principalId: user.id}, function (err, yes) {
        assert(!err && !yes);
      });
      Role.isInRole(Role.UNAUTHENTICATED, {principalType: ACL.USER, principalId: null}, function (err, yes) {
        assert(!err && yes);
      });

      Role.isInRole(Role.EVERYONE, {principalType: ACL.USER, principalId: user.id}, function (err, yes) {
        assert(!err && yes);
      });

      Role.isInRole(Role.EVERYONE, {principalType: ACL.USER, principalId: null}, function (err, yes) {
        assert(!err && yes);
      });

      // console.log('User: ', user.id);
      Album.create({name: 'Album 1', userId: user.id}, function (err, album1) {
        Role.isInRole(Role.OWNER, {principalType: ACL.USER, principalId: user.id, model: Album, id: album1.id}, function (err, yes) {
          assert(!err && yes);
        });
        Album.create({name: 'Album 2'}, function (err, album2) {
          Role.isInRole(Role.OWNER, {principalType: ACL.USER, principalId: user.id, model: Album, id: album2.id}, function (err, yes) {
            assert(!err && !yes);
          });
        });
      });
    });

  });

});




