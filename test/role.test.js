// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const assert = require('assert');
const sinon = require('sinon');
const loopback = require('../index');
const async = require('async');
const extend = require('util')._extend;
const expect = require('./helpers/expect');
const Promise = require('bluebird');

function checkResult(err, result) {
  assert(!err);
}

describe('role model', function() {
  this.timeout(10000);

  let app, Role, RoleMapping, User, Application, ACL;

  beforeEach(function() {
    // Use local app registry to ensure models are isolated to avoid
    // pollutions from other tests
    app = loopback({localRegistry: true, loadBuiltinModels: true});
    app.dataSource('db', {connector: 'memory'});

    ACL = app.registry.getModel('ACL');
    app.model(ACL, {dataSource: 'db'});

    User = app.registry.getModel('User');
    // Speed up the password hashing algorithm for tests
    User.settings.saltWorkFactor = 4;
    app.model(User, {dataSource: 'db'});

    Role = app.registry.getModel('Role');
    app.model(Role, {dataSource: 'db'});

    RoleMapping = app.registry.getModel('RoleMapping');
    app.model(RoleMapping, {dataSource: 'db'});

    Application = app.registry.getModel('Application');
    app.model(Application, {dataSource: 'db'});

    ACL.roleModel = Role;
    ACL.roleMappingModel = RoleMapping;
    ACL.userModel = User;
    ACL.applicationModel = Application;
  });

  it('should define role/role relations', function(done) {
    Role.create({name: 'user'}, function(err, userRole) {
      if (err) return done(err);
      Role.create({name: 'admin'}, function(err, adminRole) {
        if (err) return done(err);
        userRole.principals.create(
          {principalType: RoleMapping.ROLE, principalId: adminRole.id},
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
          },
        );
      });
    });
  });

  it('should generate created/modified properties', () => {
    return Role.create({name: 'ADMIN'})
      .then(role => {
        expect(role.toJSON().created).to.be.instanceOf(Date);
        expect(role.toJSON().modified).to.be.instanceOf(Date);
      });
  });

  it('should define role/user relations', function(done) {
    User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function(err, user) {
      if (err) return done(err);
      Role.create({name: 'userRole'}, function(err, role) {
        if (err) return done(err);
        role.principals.create({principalType: RoleMapping.USER, principalId: user.id},
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
    Role.create({name: 'userRole'}, function(err, role) {
      if (err) return done(err);

      Role.create({name: 'userRole'}, function(err, role) {
        expect(err).to.exist();
        expect(err).to.have.property('name', 'ValidationError');
        expect(err).to.have.nested.property('details.codes.name');
        expect(err.details.codes.name).to.contain('uniqueness');
        expect(err).to.have.property('statusCode', 422);

        done();
      });
    });
  });

  it('should automatically generate role id', function(done) {
    User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function(err, user) {
      if (err) return done(err);
      Role.create({name: 'userRole'}, function(err, role) {
        if (err) return done(err);
        assert(role.id);
        role.principals.create({principalType: RoleMapping.USER, principalId: user.id},
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
    User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function(err, user) {
      if (err) return done(err);
      Role.create({name: 'userRole'}, function(err, role) {
        if (err) return done(err);
        role.principals.create({principalType: RoleMapping.USER, principalId: user.id},
          function(err, p) {
            if (err) return done(err);
            async.series([
              function(next) {
                Role.isInRole(
                  'userRole',
                  {principalType: RoleMapping.USER, principalId: user.id},
                  function(err, inRole) {
                    if (err) return next(err);
                    // NOTE(bajtos) Apparently isRole is not a boolean,
                    // but the matchin role object instead
                    assert(!!inRole);
                    next();
                  },
                );
              },
              function(next) {
                Role.isInRole(
                  'userRole',
                  {principalType: RoleMapping.APP, principalId: user.id},
                  function(err, inRole) {
                    if (err) return next(err);
                    assert(!inRole);
                    next();
                  },
                );
              },
              function(next) {
                Role.isInRole(
                  'userRole',
                  {principalType: RoleMapping.USER, principalId: 100},
                  function(err, inRole) {
                    if (err) return next(err);
                    assert(!inRole);
                    next();
                  },
                );
              },
              function(next) {
                Role.getRoles(
                  {principalType: RoleMapping.USER, principalId: user.id},
                  function(err, roles) {
                    if (err) return next(err);
                    expect(roles).to.eql([
                      Role.AUTHENTICATED,
                      Role.EVERYONE,
                      role.id,
                    ]);
                    next();
                  },
                );
              },
              function(next) {
                Role.getRoles(
                  {principalType: RoleMapping.USER, principalId: user.id},
                  {returnOnlyRoleNames: true},
                  function(err, roles) {
                    if (err) return next(err);
                    expect(roles).to.eql([
                      Role.AUTHENTICATED,
                      Role.EVERYONE,
                      role.name,
                    ]);
                    next();
                  },
                );
              },
              function(next) {
                Role.getRoles(
                  {principalType: RoleMapping.APP, principalId: user.id},
                  function(err, roles) {
                    if (err) return next(err);
                    expect(roles).to.eql([
                      Role.AUTHENTICATED,
                      Role.EVERYONE,
                    ]);
                    next();
                  },
                );
              },
              function(next) {
                Role.getRoles(
                  {principalType: RoleMapping.USER, principalId: 100},
                  function(err, roles) {
                    if (err) return next(err);
                    expect(roles).to.eql([
                      Role.AUTHENTICATED,
                      Role.EVERYONE,
                    ]);
                    next();
                  },
                );
              },
              function(next) {
                Role.getRoles(
                  {principalType: RoleMapping.USER, principalId: null},
                  function(err, roles) {
                    if (err) return next(err);
                    expect(roles).to.eql([
                      Role.UNAUTHENTICATED,
                      Role.EVERYONE,
                    ]);
                    next();
                  },
                );
              },
            ], done);
          });
      });
    });
  });

  it('supports isInRole() returning a Promise', function(done) {
    const userData = {name: 'Raymond', email: 'x@y.com', password: 'foobar'};
    User.create(userData, function(err, user) {
      if (err) return done(err);
      Role.create({name: 'userRole'}, function(err, role) {
        if (err) return done(err);
        const principalData = {
          principalType: RoleMapping.USER,
          principalId: user.id,
        };
        role.principals.create(principalData, function(err, p) {
          if (err) return done(err);
          Role.isInRole('userRole', principalData)
            .then(function(inRole) {
              expect(inRole).to.be.true();
              done();
            })
            .catch(done);
        });
      });
    });
  });

  it('supports getRole() returning a Promise', function(done) {
    const userData = {name: 'Raymond', email: 'x@y.com', password: 'foobar'};
    User.create(userData, function(err, user) {
      if (err) return done(err);
      Role.create({name: 'userRole'}, function(err, role) {
        if (err) return done(err);
        const principalData = {
          principalType: RoleMapping.USER,
          principalId: user.id,
        };
        role.principals.create(principalData, function(err, p) {
          if (err) return done(err);
          Role.getRoles(principalData)
            .then(function(roles) {
              expect(roles).to.eql([
                Role.AUTHENTICATED,
                Role.EVERYONE,
                role.id,
              ]);
              done();
            })
            .catch(done);
        });
      });
    });
  });

  it('should be properly authenticated with 0 userId', function(done) {
    const userData = {name: 'Raymond', email: 'x@y.com', password: 'foobar', id: 0};
    const TestUser = app.registry.createModel({
      name: 'TestUser',
      base: 'User',
      // forceId is set to false so we can create a user with a known ID,
      // in this case 0 - which used to fail the falsy checks.
      forceId: false,
    });
    app.model(TestUser, {dataSource: 'db'});

    TestUser.create(userData, function(err, user) {
      if (err) return done(err);
      Role.create({name: 'userRole'}, function(err, role) {
        if (err) return done(err);
        role.principals.create({principalType: RoleMapping.USER, principalId: user.id},
          function(err, p) {
            if (err) return done(err);
            async.series([
              function(next) {
                Role.isInRole(
                  'userRole',
                  {principalType: RoleMapping.USER, principalId: user.id},
                  function(err, inRole) {
                    if (err) return next(err);
                    assert(!!inRole);
                    next();
                  },
                );
              },
              function(next) {
                Role.isInRole(
                  'userRole',
                  {principalType: RoleMapping.APP, principalId: user.id},
                  function(err, inRole) {
                    if (err) return next(err);
                    assert(!inRole);
                    next();
                  },
                );
              },
              function(next) {
                Role.getRoles(
                  {principalType: RoleMapping.USER, principalId: user.id},
                  function(err, roles) {
                    if (err) return next(err);
                    expect(roles).to.eql([
                      Role.AUTHENTICATED,
                      Role.EVERYONE,
                      role.id,
                    ]);
                    next();
                  },
                );
              },
            ], done);
          });
      });
    });
  });

  // this test should be split to address one resolver at a time
  it('supports built-in role resolvers', function(done) {
    Role.registerResolver('returnPromise', function(role, context) {
      return new Promise(function(resolve) {
        process.nextTick(function() {
          resolve(true);
        });
      });
    });

    const Album = app.registry.createModel('Album', {
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
    app.model(Album, {dataSource: 'db'});

    User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function(err, user) {
      if (err) return done(err);
      async.parallel([
        function(next) {
          Role.isInRole(
            'returnPromise',
            {principalType: ACL.USER, principalId: user.id},
            function(err, yes) {
              if (err) return next(err);
              assert(yes);
              next();
            },
          );
        },
        function(next) {
          Role.isInRole(
            Role.AUTHENTICATED,
            {principalType: ACL.USER, principalId: user.id},
            function(err, yes) {
              if (err) next(err);
              assert(yes);
              next();
            },
          );
        },
        function(next) {
          Role.isInRole(
            Role.AUTHENTICATED,
            {principalType: ACL.USER, principalId: null},
            function(err, yes) {
              if (err) next(err);
              assert(!yes);
              next();
            },
          );
        },
        function(next) {
          Role.isInRole(
            Role.UNAUTHENTICATED,
            {principalType: ACL.USER, principalId: user.id},
            function(err, yes) {
              if (err) return next(err);
              assert(!yes);
              next();
            },
          );
        },
        function(next) {
          Role.isInRole(
            Role.UNAUTHENTICATED,
            {principalType: ACL.USER, principalId: null},
            function(err, yes) {
              if (err) return next(err);
              assert(yes);
              next();
            },
          );
        },
        function(next) {
          Role.isInRole(
            Role.EVERYONE,
            {principalType: ACL.USER, principalId: user.id},
            function(err, yes) {
              if (err) return next(err);
              assert(yes);
              next();
            },
          );
        },
        function(next) {
          Role.isInRole(
            Role.EVERYONE,
            {principalType: ACL.USER, principalId: null},
            function(err, yes) {
              if (err) return next(err);
              assert(yes);
              next();
            },
          );
        },
        function(next) {
          Album.create({name: 'Album 1', userId: user.id}, function(err, album1) {
            if (err) return done(err);
            let role = {
              principalType: ACL.USER, principalId: user.id,
              model: Album, id: album1.id,
            };
            Role.isInRole(Role.OWNER, role, function(err, yes) {
              if (err) return next(err);
              assert(yes);

              Album.create({name: 'Album 2'}, function(err, album2) {
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

  describe('$owner role resolver', function() {
    let sender, receiver;
    const users = [
      {username: 'sender', email: 'sender@example.com', password: 'pass'},
      {username: 'receiver', email: 'receiver@example.com', password: 'pass'},
    ];

    describe('ownerRelations not set (legacy behaviour)', () => {
      it('resolves the owner via property "userId"', function() {
        let user;
        const Album = app.registry.createModel('Album', {
          name: String,
          userId: Number,
        });
        app.model(Album, {dataSource: 'db'});

        return User.create({email: 'test@example.com', password: 'pass'})
          .then(u => {
            user = u;
            return Album.create({name: 'Album 1', userId: user.id});
          })
          .then(album => {
            return Role.isInRole(Role.OWNER, {
              principalType: ACL.USER,
              principalId: user.id,
              model: Album,
              id: album.id,
            });
          })
          .then(isInRole => expect(isInRole).to.be.true());
      });

      it('resolves the owner via property "owner"', function() {
        let user;
        const Album = app.registry.createModel('Album', {
          name: String,
          owner: Number,
        });
        app.model(Album, {dataSource: 'db'});

        return User.create({email: 'test@example.com', password: 'pass'})
          .then(u => {
            user = u;
            return Album.create({name: 'Album 1', owner: user.id});
          })
          .then(album => {
            return Role.isInRole(Role.OWNER, {
              principalType: ACL.USER,
              principalId: user.id,
              model: Album,
              id: album.id,
            });
          })
          .then(isInRole => expect(isInRole).to.be.true());
      });

      it('resolves the owner via a belongsTo relation', function() {
        // passing no options will result calling
        // the legacy $owner role resolver behavior
        const Message = givenModelWithSenderReceiverRelations('ModelWithNoOptions');

        return givenUsers()
          .then(() => {
            const messages = [
              {content: 'firstMessage', senderId: sender.id},
              {content: 'secondMessage', receiverId: receiver.id},
              {content: 'thirdMessage'},
            ];
            return Promise.map(messages, msg => {
              return Message.create(msg);
            });
          })
          .then(messages => {
            return Promise.all([
              isOwnerForMessage(sender, messages[0]),
              isOwnerForMessage(receiver, messages[1]),
              isOwnerForMessage(receiver, messages[2]),
            ]);
          })
          .then(result => {
            expect(result).to.eql([
              {user: 'sender', msg: 'firstMessage', isOwner: true},
              {user: 'receiver', msg: 'secondMessage', isOwner: false},
              {user: 'receiver', msg: 'thirdMessage', isOwner: false},
            ]);
          });
      });
    });

    it('resolves as false without belongsTo relation', function() {
      let user;
      const Album = app.registry.createModel(
        'Album',
        {
          name: String,
          userId: Number,
          owner: Number,
        },
        // passing {ownerRelations: true} will enable the new $owner role resolver
        // and hence resolve false when no belongsTo relation is defined
        {ownerRelations: true},
      );
      app.model(Album, {dataSource: 'db'});

      return User.create({email: 'test@example.com', password: 'pass'})
        .then(u => {
          user = u;
          return Album.create({name: 'Album 1', userId: user.id, owner: user.id});
        })
        .then(album => {
          return Role.isInRole(Role.OWNER, {
            principalType: ACL.USER,
            principalId: user.id,
            model: Album,
            id: album.id,
          });
        })
        .then(isInRole => expect(isInRole).to.be.false());
    });

    it('resolves the owner using the corrent belongsTo relation', function() {
      // passing {ownerRelations: true} will enable the new $owner role resolver
      // with any belongsTo relation allowing to resolve truthy
      const Message = givenModelWithSenderReceiverRelations(
        'ModelWithAllRelations',
        {ownerRelations: true},
      );

      return givenUsers()
        .then(() => {
          const messages = [
            {content: 'firstMessage', senderId: sender.id},
            {content: 'secondMessage', receiverId: receiver.id},
            {content: 'thirdMessage'},
          ];
          return Promise.map(messages, msg => {
            return Message.create(msg);
          });
        })
        .then(messages => {
          return Promise.all([
            isOwnerForMessage(sender, messages[0]),
            isOwnerForMessage(receiver, messages[1]),
            isOwnerForMessage(receiver, messages[2]),
          ]);
        })
        .then(result => {
          expect(result).to.eql([
            {user: 'sender', msg: 'firstMessage', isOwner: true},
            {user: 'receiver', msg: 'secondMessage', isOwner: true},
            {user: 'receiver', msg: 'thirdMessage', isOwner: false},
          ]);
        });
    });

    it('allows fine-grained control of which relations grant ownership',
      function() {
      // passing {ownerRelations: true} will enable the new $owner role resolver
      // with a specified list of belongsTo relations allowing to resolve truthy
        const Message = givenModelWithSenderReceiverRelations(
          'ModelWithCoercedRelations',
          {ownerRelations: ['receiver']},
        );

        return givenUsers()
          .then(() => {
            const messages = [
              {content: 'firstMessage', senderId: sender.id},
              {content: 'secondMessage', receiverId: receiver.id},
              {content: 'thirdMessage'},
            ];
            return Promise.map(messages, msg => {
              return Message.create(msg);
            });
          })
          .then(messages => {
            return Promise.all([
              isOwnerForMessage(sender, messages[0]),
              isOwnerForMessage(receiver, messages[1]),
              isOwnerForMessage(receiver, messages[2]),
            ]);
          })
          .then(result => {
            expect(result).to.eql([
              {user: 'sender', msg: 'firstMessage', isOwner: false},
              {user: 'receiver', msg: 'secondMessage', isOwner: true},
              {user: 'receiver', msg: 'thirdMessage', isOwner: false},
            ]);
          });
      });

    // helpers
    function givenUsers() {
      return Promise.map(users, user => {
        return User.create(user);
      })
        .then(users => {
          sender = users[0];
          receiver = users[1];
        });
    }

    function isOwnerForMessage(user, msg) {
      const accessContext = {
        principalType: ACL.USER,
        principalId: user.id,
        model: msg.constructor,
        id: msg.id,
      };
      return Role.isInRole(Role.OWNER, accessContext)
        .then(isOwner => {
          return {
            user: user.username,
            msg: msg.content,
            isOwner,
          };
        });
    }

    function givenModelWithSenderReceiverRelations(name, options) {
      const baseOptions = {
        relations: {
          sender: {
            type: 'belongsTo',
            model: 'User',
            foreignKey: 'senderId',
          },
          receiver: {
            type: 'belongsTo',
            model: 'User',
            foreignKey: 'receiverId',
          },
        },
      };
      options = extend(baseOptions, options);
      const Model = app.registry.createModel(
        name,
        {content: String},
        options,
      );
      app.model(Model, {dataSource: 'db'});
      return Model;
    }
  });

  it('passes accessToken to modelClass.findById when resolving OWNER', () => {
    const Album = app.registry.createModel('Album', {name: String});
    app.model(Album, {dataSource: 'db'});
    Album.belongsTo(User);

    let observedOptions = null;
    Album.observe('access', ctx => {
      observedOptions = ctx.options;
      return Promise.resolve();
    });

    let user, token;
    return User.create({email: 'test@example.com', password: 'pass'})
      .then(u => {
        user = u;
        return Album.create({name: 'Album 1', userId: user.id});
      })
      .then(album => {
        return Role.isInRole(Role.OWNER, {
          principalType: ACL.USER, principalId: user.id,
          model: Album, id: album.id,
          accessToken: 'test-token',
        });
      })
      .then(isInRole => {
        expect(observedOptions).to.eql({accessToken: 'test-token'});
      });
  });

  describe('isMappedToRole', function() {
    let user, app, role;

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
              const principals = [
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

    it('supports ACL.resolvePrincipal() returning a promise', function() {
      return ACL.resolvePrincipal(ACL.USER, user.id)
        .then(function(u) {
          expect(u.id).to.eql(user.id);
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

    it('supports ACL.isMappedToRole() returning a promise', function() {
      return ACL.isMappedToRole(ACL.USER, user.username, 'admin')
        .then(function(flag) {
          expect(flag).to.be.true();
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
  });

  describe('listByPrincipalType', function() {
    let sandbox;

    beforeEach(function() {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
      sandbox.restore();
    });

    it('should fetch all models assigned to the role', function(done) {
      const principalTypesToModels = {};
      let runs = 0;

      principalTypesToModels[RoleMapping.USER] = User;
      principalTypesToModels[RoleMapping.APPLICATION] = Application;
      principalTypesToModels[RoleMapping.ROLE] = Role;

      const mappings = Object.keys(principalTypesToModels);

      mappings.forEach(function(principalType) {
        const Model = principalTypesToModels[principalType];
        Model.create({name: 'test', email: 'x@y.com', password: 'foobar'}, function(err, model) {
          if (err) return done(err);
          const uniqueRoleName = 'testRoleFor' + principalType;
          Role.create({name: uniqueRoleName}, function(err, role) {
            if (err) return done(err);
            role.principals.create({principalType: principalType, principalId: model.id},
              function(err, p) {
                if (err) return done(err);
                const pluralName = Model.pluralModelName.toLowerCase();
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
      const principalTypesToModels = {};

      principalTypesToModels[RoleMapping.USER] = User;
      principalTypesToModels[RoleMapping.APPLICATION] = Application;
      principalTypesToModels[RoleMapping.ROLE] = Role;

      const mappings = Object.keys(principalTypesToModels);

      async.each(mappings, function(principalType, eachCallback) {
        const Model = principalTypesToModels[principalType];

        async.waterfall([
          // Create models
          function(next) {
            Model.create([
              {name: 'test', email: 'x@y.com', password: 'foobar'},
              {name: 'test2', email: 'f@v.com', password: 'bargoo'},
              {name: 'test3', email: 'd@t.com', password: 'bluegoo'}],
            function(err, models) {
              if (err) return next(err);
              next(null, models);
            });
          },

          // Create Roles
          function(models, next) {
            const uniqueRoleName = 'testRoleFor' + principalType;
            const otherUniqueRoleName = 'otherTestRoleFor' + principalType;
            Role.create([
              {name: uniqueRoleName},
              {name: otherUniqueRoleName}],
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
                  {principalType: principalType, principalId: models[0].id},
                  function(err, p) {
                    if (err) return callback(err);
                    callback(p);
                  },
                );
              },
              function(callback) {
                roles[1].principals.create(
                  {principalType: principalType, principalId: models[1].id},
                  function(err, p) {
                    if (err) return callback(err);
                    callback(p);
                  },
                );
              }],
            function(err, principles) {
              next(null, models, roles, principles);
            });
          },

          // Run tests against unique Role
          function(models, roles, principles, next) {
            const pluralName = Model.pluralModelName.toLowerCase();
            const uniqueRole = roles[0];
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
      User.create({name: 'Raymond', email: 'x@y.com', password: 'foobar'}, function(err, user) {
        if (err) return done(err);
        Role.create({name: 'userRole'}, function(err, role) {
          if (err) return done(err);
          role.principals.create({principalType: RoleMapping.USER, principalId: user.id},
            function(err, p) {
              if (err) return done(err);
              const query = {fields: ['id', 'name']};
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

    it('supports Promise API', function(done) {
      const userData = {name: 'Raymond', email: 'x@y.com', password: 'foobar'};
      User.create(userData, function(err, user) {
        if (err) return done(err);
        Role.create({name: 'userRole'}, function(err, role) {
          if (err) return done(err);
          const principalData = {
            principalType: RoleMapping.USER,
            principalId: user.id,
          };
          role.principals.create(principalData, function(err, p) {
            if (err) return done(err);
            role.users()
              .then(function(users) {
                const userIds = users.map(function(u) { return u.id; });
                expect(userIds).to.eql([user.id]);
                done();
              })
              .catch(done);
          });
        });
      });
    });
  });

  describe('isOwner', function() {
    it('supports app-local model registry', function(done) {
      const app = loopback({localRegistry: true, loadBuiltinModels: true});
      app.dataSource('db', {connector: 'memory'});
      // attach all auth-related models to 'db' datasource
      app.enableAuth({dataSource: 'db'});

      const Role = app.models.Role;
      const User = app.models.User;

      // Speed up the password hashing algorithm for tests
      User.settings.saltWorkFactor = 4;

      const u = app.registry.findModel('User');
      const credentials = {email: 'test@example.com', password: 'pass'};
      User.create(credentials, function(err, user) {
        if (err) return done(err);

        Role.isOwner(User, user.id, user.id, function(err, result) {
          if (err) return done(err);

          expect(result, 'isOwner result').to.equal(true);

          done();
        });
      });
    });

    it('supports Promise API', function(done) {
      const credentials = {email: 'test@example.com', password: 'pass'};
      User.create(credentials, function(err, user) {
        if (err) return done(err);

        Role.isOwner(User, user.id, user.id)
          .then(function(result) {
            expect(result, 'isOwner result').to.equal(true);
            done();
          })
          .catch(done);
      });
    });
  });
});
