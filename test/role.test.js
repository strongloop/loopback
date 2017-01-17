// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var assert = require('assert');
var sinon = require('sinon');
var loopback = require('../index');
var async = require('async');
var expect = require('chai').expect;
var Promise = require('bluebird');

function checkResult(err, result) {
  assert(!err);
}

describe('role model', function() {
  this.timeout(10000);

  var app, Role, RoleMapping, User, Application, ACL;

  beforeEach(function() {
    // Use local app registry to ensure models are isolated to avoid
    // pollutions from other tests
    app = loopback({ localRegistry: true, loadBuiltinModels: true });
    app.set('logoutSessionsOnSensitiveChanges', true);
    app.dataSource('db', { connector: 'memory' });

    ACL = app.registry.getModel('ACL');
    app.model(ACL, { dataSource: 'db' });

    User = app.registry.getModel('User');
    app.model(User, { dataSource: 'db' });

    Role = app.registry.getModel('Role');
    app.model(Role, { dataSource: 'db' });

    RoleMapping = app.registry.getModel('RoleMapping');
    app.model(RoleMapping, { dataSource: 'db' });

    Application = app.registry.getModel('Application');
    app.model(Application, { dataSource: 'db' });

    ACL.roleModel = Role;
    ACL.roleMappingModel = RoleMapping;
    ACL.userModel = User;
    ACL.applicationModel = Application;
    Role.roleMappingModel = RoleMapping;
    Role.userModel = User;
    Role.applicationModel = Application;
  });

  it('should define role/role relations', function(done) {
    Role.create({ name: 'user' }, function(err, userRole) {
      if (err) return done(err);
      Role.create({ name: 'admin' }, function(err, adminRole) {
        if (err) return done(err);
        userRole.principals.create(
          { principalType: RoleMapping.ROLE, principalId: adminRole.id },
          function(err, mapping) {
            if (err) return done(err);

            async.parallel([
              function(next) {
                Role.find(function(err, roles) {
                  if (err) return next(err);
                  assert.equal(roles.length, 2);
                  next();
                });
              },
              function(next) {
                RoleMapping.find(function(err, mappings) {
                  if (err) return next(err);
                  assert.equal(mappings.length, 1);
                  assert.equal(mappings[0].principalType, RoleMapping.ROLE);
                  assert.equal(mappings[0].principalId, adminRole.id);
                  next();
                });
              },
              function(next) {
                userRole.principals(function(err, principals) {
                  if (err) return next(err);
                  assert.equal(principals.length, 1);
                  next();
                });
              },
              function(next) {
                userRole.roles(function(err, roles) {
                  if (err) return next(err);
                  assert.equal(roles.length, 1);
                  next();
                });
              },
            ], done);
          });
      });
    });
  });

  it('should define role/user relations', function(done) {
    User.create({ name: 'Raymond', email: 'x@y.com', password: 'foobar' }, function(err, user) {
      if (err) return done(err);
      Role.create({ name: 'userRole' }, function(err, role) {
        if (err) return done(err);
        role.principals.create({ principalType: RoleMapping.USER, principalId: user.id },
        function(err, p) {
          if (err) return done(err);
          async.parallel([
            function(next) {
              Role.find(function(err, roles) {
                if (err) return next(err);
                assert.equal(roles.length, 1);
                assert.equal(roles[0].name, 'userRole');
                next();
              });
            },
            function(next) {
              role.principals(function(err, principals) {
                if (err) return next(err);
                assert.equal(principals.length, 1);
                assert.equal(principals[0].principalType, RoleMapping.USER);
                assert.equal(principals[0].principalId, user.id);
                next();
              });
            },
            function(next) {
              role.users(function(err, users) {
                if (err) return next(err);
                assert.equal(users.length, 1);
                assert.equal(users[0].id, user.id);
                next();
              });
            },
          ], done);
        });
      });
    });
  });

  it('should not allow duplicate role name', function(done) {
    Role.create({ name: 'userRole' }, function(err, role) {
      if (err) return done(err);

      Role.create({ name: 'userRole' }, function(err, role) {
        expect(err).to.exist; //jshint ignore:line
        expect(err).to.have.property('name', 'ValidationError');
        expect(err).to.have.deep.property('details.codes.name');
        expect(err.details.codes.name).to.contain('uniqueness');
        expect(err).to.have.property('statusCode', 422);

        done();
      });
    });
  });

  it('should automatically generate role id', function(done) {
    User.create({ name: 'Raymond', email: 'x@y.com', password: 'foobar' }, function(err, user) {
      if (err) return done(err);
      Role.create({ name: 'userRole' }, function(err, role) {
        if (err) return done(err);
        assert(role.id);
        role.principals.create({ principalType: RoleMapping.USER, principalId: user.id },
        function(err, p) {
          if (err) return done(err);
          assert(p.id);
          assert.equal(p.roleId, role.id);
          async.parallel([
            function(next) {
              Role.find(function(err, roles) {
                if (err) return next(err);
                assert.equal(roles.length, 1);
                assert.equal(roles[0].name, 'userRole');
                next();
              });
            },
            function(next) {
              role.principals(function(err, principals) {
                if (err) return next(err);
                assert.equal(principals.length, 1);
                assert.equal(principals[0].principalType, RoleMapping.USER);
                assert.equal(principals[0].principalId, user.id);
                next();
              });
            },
            function(next) {
              role.users(function(err, users) {
                if (err) return next(err);
                assert.equal(users.length, 1);
                assert.equal(users[0].id, user.id);
              });
              next();
            },
          ], done);
        });
      });
    });
  });

  it('should support getRoles() and isInRole()', function(done) {
    User.create({ name: 'Raymond', email: 'x@y.com', password: 'foobar' }, function(err, user) {
      if (err) return done(err);
      Role.create({ name: 'userRole' }, function(err, role) {
        if (err) return done(err);
        role.principals.create({ principalType: RoleMapping.USER, principalId: user.id },
        function(err, p) {
          if (err) return done(err);
          async.series([
            function(next) {
              Role.isInRole(
                'userRole',
                { principalType: RoleMapping.USER, principalId: user.id },
                function(err, inRole) {
                  if (err) return next(err);
                  // NOTE(bajtos) Apparently isRole is not a boolean,
                  // but the matchin role object instead
                  assert(!!inRole);
                  next();
                });
            },
            function(next) {
              Role.isInRole(
                'userRole',
                { principalType: RoleMapping.APP, principalId: user.id },
                function(err, inRole) {
                  if (err) return next(err);
                  assert(!inRole);
                  next();
                });
            },
            function(next) {
              Role.isInRole(
                'userRole',
                { principalType: RoleMapping.USER, principalId: 100 },
                function(err, inRole) {
                  if (err) return next(err);
                  assert(!inRole);
                  next();
                });
            },
            function(next) {
              Role.getRoles(
                { principalType: RoleMapping.USER, principalId: user.id },
                function(err, roles) {
                  if (err) return next(err);
                  expect(roles).to.eql([
                    Role.AUTHENTICATED,
                    Role.EVERYONE,
                    role.id,
                  ]);
                  next();
                });
            },
            function(next) {
              Role.getRoles(
                { principalType: RoleMapping.USER, principalId: user.id },
                { returnOnlyRoleNames: true },
                function(err, roles) {
                  if (err) return next(err);
                  expect(roles).to.eql([
                    Role.AUTHENTICATED,
                    Role.EVERYONE,
                    role.name,
                  ]);
                  next();
                });
            },
            function(next) {
              Role.getRoles(
                { principalType: RoleMapping.APP, principalId: user.id },
                function(err, roles) {
                  if (err) return next(err);
                  expect(roles).to.eql([
                    Role.AUTHENTICATED,
                    Role.EVERYONE,
                  ]);
                  next();
                });
            },
            function(next) {
              Role.getRoles(
                { principalType: RoleMapping.USER, principalId: 100 },
                function(err, roles) {
                  if (err) return next(err);
                  expect(roles).to.eql([
                    Role.AUTHENTICATED,
                    Role.EVERYONE,
                  ]);
                  next();
                });
            },
            function(next) {
              Role.getRoles(
                { principalType: RoleMapping.USER, principalId: null },
                function(err, roles) {
                  if (err) return next(err);
                  expect(roles).to.eql([
                    Role.UNAUTHENTICATED,
                    Role.EVERYONE,
                  ]);
                  next();
                });
            },
          ], done);
        });
      });
    });
  });

  it('should support owner role resolver', function(done) {
    Role.registerResolver('returnPromise', function(role, context) {
      return new Promise(function(resolve) {
        process.nextTick(function() {
          resolve(true);
        });
      });
    });

    var Album = app.registry.createModel('Album', {
      name: String,
      userId: Number,
    }, {
      relations: {
        user: {
          type: 'belongsTo',
          model: 'User',
          foreignKey: 'userId',
        },
      },
    });
    app.model(Album, { dataSource: 'db' });

    User.create({ name: 'Raymond', email: 'x@y.com', password: 'foobar' }, function(err, user) {
      if (err) return done(err);
      async.parallel([
        function(next) {
          Role.isInRole(
            'returnPromise',
            { principalType: ACL.USER, principalId: user.id },
            function(err, yes) {
              if (err) return next(err);
              assert(yes);
              next();
            });
        },
        function(next) {
          Role.isInRole(
            Role.AUTHENTICATED,
            { principalType: ACL.USER, principalId: user.id },
            function(err, yes) {
              if (err) next(err);
              assert(yes);
              next();
            });
        },
        function(next) {
          Role.isInRole(
            Role.AUTHENTICATED,
            { principalType: ACL.USER, principalId: null },
            function(err, yes) {
              if (err) next(err);
              assert(!yes);
              next();
            });
        },
        function(next) {
          Role.isInRole(
            Role.UNAUTHENTICATED,
            { principalType: ACL.USER, principalId: user.id },
            function(err, yes) {
              if (err) return next(err);
              assert(!yes);
              next();
            });
        },
        function(next) {
          Role.isInRole(
            Role.UNAUTHENTICATED,
            { principalType: ACL.USER, principalId: null },
            function(err, yes) {
              if (err) return next(err);
              assert(yes);
              next();
            });
        },
        function(next) {
          Role.isInRole(
            Role.EVERYONE,
            { principalType: ACL.USER, principalId: user.id },
            function(err, yes) {
              if (err) return next(err);
              assert(yes);
              next();
            });
        },
        function(next) {
          Role.isInRole(
            Role.EVERYONE,
            { principalType: ACL.USER, principalId: null },
            function(err, yes) {
              if (err) return next(err);
              assert(yes);
              next();
            });
        },
        function(next) {
          Album.create({ name: 'Album 1', userId: user.id }, function(err, album1) {
            if (err) return done(err);
            var role = {
              principalType: ACL.USER, principalId: user.id,
              model: Album, id: album1.id,
            };
            Role.isInRole(Role.OWNER, role, function(err, yes) {
              if (err) return next(err);
              assert(yes);

              Album.create({ name: 'Album 2' }, function(err, album2) {
                if (err) return next(err);
                role = {
                  principalType: ACL.USER, principalId: user.id,
                  model: Album, id: album2.id,
                };
                Role.isInRole(Role.OWNER, role, function(err, yes) {
                  if (err) return next(err);
                  assert(!yes);
                  next();
                });
              });
            });
          });
        },
      ], done);
    });
  });

  describe('isMappedToRole', function() {
    var user, app, role;

    beforeEach(function(done) {
      User.create({
        username: 'john',
        email: 'john@gmail.com',
        password: 'jpass',
      }, function(err, u) {
        if (err) return done(err);

        user = u;
        User.create({
          username: 'mary',
          email: 'mary@gmail.com',
          password: 'mpass',
        }, function(err, u) {
          if (err) return done(err);

          Application.create({
            name: 'demo',
          }, function(err, a) {
            if (err) return done(err);

            app = a;
            Role.create({
              name: 'admin',
            }, function(err, r) {
              if (err) return done(err);

              role = r;
              var principals = [
                {
                  principalType: ACL.USER,
                  principalId: user.id,
                },
                {
                  principalType: ACL.APP,
                  principalId: app.id,
                },
              ];
              async.each(principals, function(p, done) {
                role.principals.create(p, done);
              }, done);
            });
          });
        });
      });
    });

    it('should resolve user by id', function(done) {
      ACL.resolvePrincipal(ACL.USER, user.id, function(err, u) {
        if (err) return done(err);

        expect(u.id).to.eql(user.id);

        done();
      });
    });

    it('should resolve user by username', function(done) {
      ACL.resolvePrincipal(ACL.USER, user.username, function(err, u) {
        if (err) return done(err);

        expect(u.username).to.eql(user.username);

        done();
      });
    });

    it('should resolve user by email', function(done) {
      ACL.resolvePrincipal(ACL.USER, user.email, function(err, u) {
        if (err) return done(err);

        expect(u.email).to.eql(user.email);

        done();
      });
    });

    it('should resolve app by id', function(done) {
      ACL.resolvePrincipal(ACL.APP, app.id, function(err, a) {
        if (err) return done(err);

        expect(a.id).to.eql(app.id);

        done();
      });
    });

    it('should resolve app by name', function(done) {
      ACL.resolvePrincipal(ACL.APP, app.name, function(err, a) {
        if (err) return done(err);

        expect(a.name).to.eql(app.name);

        done();
      });
    });

    it('should report isMappedToRole by user.username', function(done) {
      ACL.isMappedToRole(ACL.USER, user.username, 'admin', function(err, flag) {
        if (err) return done(err);

        expect(flag).to.eql(true);

        done();
      });
    });

    it('should report isMappedToRole by user.email', function(done) {
      ACL.isMappedToRole(ACL.USER, user.email, 'admin', function(err, flag) {
        if (err) return done(err);

        expect(flag).to.eql(true);

        done();
      });
    });

    it('should report isMappedToRole by user.username for mismatch',
      function(done) {
        ACL.isMappedToRole(ACL.USER, 'mary', 'admin', function(err, flag) {
          if (err) return done(err);

          expect(flag).to.eql(false);

          done();
        });
      });

    it('should report isMappedToRole by app.name', function(done) {
      ACL.isMappedToRole(ACL.APP, app.name, 'admin', function(err, flag) {
        if (err) return done(err);

        expect(flag).to.eql(true);

        done();
      });
    });

    it('should report isMappedToRole by app.name', function(done) {
      ACL.isMappedToRole(ACL.APP, app.name, 'admin', function(err, flag) {
        if (err) return done(err);

        expect(flag).to.eql(true);

        done();
      });
    });
  });

  describe('listByPrincipalType', function() {
    var sandbox;

    beforeEach(function() {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
      sandbox.restore();
    });

    it('should fetch all models assigned to the role', function(done) {
      var principalTypesToModels = {};
      var runs = 0;
      var mappings;

      principalTypesToModels[RoleMapping.USER] = User;
      principalTypesToModels[RoleMapping.APPLICATION] = Application;
      principalTypesToModels[RoleMapping.ROLE] = Role;

      mappings = Object.keys(principalTypesToModels);

      mappings.forEach(function(principalType) {
        var Model = principalTypesToModels[principalType];
        Model.create({ name: 'test', email: 'x@y.com', password: 'foobar' }, function(err, model) {
          if (err) return done(err);
          var uniqueRoleName = 'testRoleFor' + principalType;
          Role.create({ name: uniqueRoleName }, function(err, role) {
            if (err) return done(err);
            role.principals.create({ principalType: principalType, principalId: model.id },
            function(err, p) {
              if (err) return done(err);
              var pluralName = Model.pluralModelName.toLowerCase();
              role[pluralName](function(err, models) {
                if (err) return done(err);
                assert.equal(models.length, 1);

                if (++runs === mappings.length) {
                  done();
                }
              });
            });
          });
        });
      });
    });

    it('should fetch all models only assigned to the role', function(done) {
      var principalTypesToModels = {};
      var mappings;

      principalTypesToModels[RoleMapping.USER] = User;
      principalTypesToModels[RoleMapping.APPLICATION] = Application;
      principalTypesToModels[RoleMapping.ROLE] = Role;
      mappings = Object.keys(principalTypesToModels);

      async.each(mappings, function(principalType, eachCallback) {
        var Model = principalTypesToModels[principalType];

        async.waterfall([
          // Create models
          function(next) {
            Model.create([
                { name: 'test', email: 'x@y.com', password: 'foobar' },
                { name: 'test2', email: 'f@v.com', password: 'bargoo' },
                { name: 'test3', email: 'd@t.com', password: 'bluegoo' }],
              function(err, models) {
                if (err) return next(err);
                next(null, models);
              });
          },

          // Create Roles
          function(models, next) {
            var uniqueRoleName = 'testRoleFor' + principalType;
            var otherUniqueRoleName = 'otherTestRoleFor' + principalType;
            Role.create([
                { name: uniqueRoleName },
                { name: otherUniqueRoleName }],
              function(err, roles) {
                if (err) return next(err);
                next(null, models, roles);
              });
          },

          // Create principles
          function(models, roles, next) {
            async.parallel([
              function(callback) {
                roles[0].principals.create(
                  { principalType: principalType, principalId: models[0].id },
                  function(err, p) {
                    if (err) return callback(err);
                    callback(p);
                  });
              },
              function(callback) {
                roles[1].principals.create(
                  { principalType: principalType, principalId: models[1].id },
                  function(err, p) {
                    if (err) return callback(err);
                    callback(p);
                  });
              }],
            function(err, principles) {
              next(null, models, roles, principles);
            });
          },

          // Run tests against unique Role
          function(models, roles, principles, next) {
            var pluralName = Model.pluralModelName.toLowerCase();
            var uniqueRole = roles[0];
            uniqueRole[pluralName](function(err, models) {
              if (err) return done(err);
              assert.equal(models.length, 1);
              next();
            });
          }],
        eachCallback);
      }, function(err) {
        done();
      });
    });

    it('should apply query', function(done) {
      User.create({ name: 'Raymond', email: 'x@y.com', password: 'foobar' }, function(err, user) {
        if (err) return done(err);
        Role.create({ name: 'userRole' }, function(err, role) {
          if (err) return done(err);
          role.principals.create({ principalType: RoleMapping.USER, principalId: user.id },
          function(err, p) {
            if (err) return done(err);
            var query = { fields: ['id', 'name'] };
            sandbox.spy(User, 'find');
            role.users(query, function(err, users) {
              if (err) return done(err);
              assert.equal(users.length, 1);
              assert.equal(users[0].id, user.id);
              assert(User.find.calledWith(query));

              done();
            });
          });
        });
      });
    });
  });

  describe('isOwner', function() {
    it('supports app-local model registry', function(done) {
      var app = loopback({ localRegistry: true, loadBuiltinModels: true });
      app.set('logoutSessionsOnSensitiveChanges', true);
      app.dataSource('db', { connector: 'memory' });
      // attach all auth-related models to 'db' datasource
      app.enableAuth({ dataSource: 'db' });

      var Role = app.models.Role;
      var User = app.models.User;

      var u = app.registry.findModel('User');
      var credentials = { email: 'test@example.com', password: 'pass' };
      User.create(credentials, function(err, user) {
        if (err) return done(err);

        Role.isOwner(User, user.id, user.id, function(err, result) {
          if (err) return done(err);

          expect(result, 'isOwner result').to.equal(true);

          done();
        });
      });
    });
  });
});
