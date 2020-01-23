// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const expect = require('./helpers/expect');
const loopback = require('../');
const ctx = require('../lib/access-context');
const extend = require('util')._extend;
const AccessContext = ctx.AccessContext;
const Principal = ctx.Principal;
const Promise = require('bluebird');
const waitForEvent = require('./helpers/wait-for-event');
const supertest = require('supertest');
const loggers = require('./helpers/error-loggers');
const logServerErrorsOtherThan = loggers.logServerErrorsOtherThan;

describe('Multiple users with custom principalType', function() {
  this.timeout(10000);

  const commonCredentials = {email: 'foo@bar.com', password: 'bar'};
  let app, OneUser, AnotherUser, AccessToken, Role,
    userFromOneModel, userFromAnotherModel, userRole, userOneBaseContext;

  beforeEach(function setupAppAndModels() {
    // create a local app object that does not share state with other tests
    app = loopback({localRegistry: true, loadBuiltinModels: true});
    app.set('_verifyAuthModelRelations', false);
    app.set('remoting', {rest: {handleErrors: false}});
    app.dataSource('db', {connector: 'memory'});

    const userModelOptions = {
      base: 'User',
      // forceId is set to false for the purpose of updating the same affected user within the
      // `Email Update` test cases.
      forceId: false,
      // Speed up the password hashing algorithm for tests
      saltWorkFactor: 4,
    };

    // create and attach 2 User-based models
    OneUser = createUserModel(app, 'OneUser', userModelOptions);
    AnotherUser = createUserModel(app, 'AnotherUser', userModelOptions);

    AccessToken = app.registry.getModel('AccessToken');
    app.model(AccessToken, {dataSource: 'db'});

    Role = app.registry.getModel('Role');
    app.model(Role, {dataSource: 'db'});

    // Update AccessToken and Users to bind them through polymorphic relations
    AccessToken.belongsTo('user', {idName: 'id', polymorphic: {idType: 'string',
      foreignKey: 'userId', discriminator: 'principalType'}});
    OneUser.hasMany('accessTokens', {polymorphic: {foreignKey: 'userId',
      discriminator: 'principalType'}});
    AnotherUser.hasMany('accessTokens', {polymorphic: {foreignKey: 'userId',
      discriminator: 'principalType'}});

    app.enableAuth({dataSource: 'db'});
    app.use(loopback.token({model: AccessToken}));
    app.use(loopback.rest());

    // create one user per user model to use them throughout the tests
    return Promise.all([
      OneUser.create(commonCredentials),
      AnotherUser.create(commonCredentials),
      Role.create({name: 'userRole'}),
    ])
      .spread(function(u1, u2, r) {
        userFromOneModel = u1;
        userFromAnotherModel = u2;
        userRole = r;
        userOneBaseContext = {
          principalType: OneUser.modelName,
          principalId: userFromOneModel.id,
        };
      });
  });

  describe('User.login', function() {
    it('works for one user model and valid credentials', function() {
      return OneUser.login(commonCredentials)
        .then(function(accessToken) {
          assertGoodToken(accessToken, userFromOneModel);
        });
    });

    it('works for a second user model and valid credentials', function() {
      return AnotherUser.login(commonCredentials)
        .then(function(accessToken) {
          assertGoodToken(accessToken, userFromAnotherModel);
        });
    });

    it('fails when credentials are not correct', function() {
      return OneUser.login({email: 'foo@bar.com', password: 'invalid'})
        .then(
          function onSuccess() {
            throw new Error('OneUser.login() should have failed');
          },
          function onError(err) {
            expect(err).to.have.property('code', 'LOGIN_FAILED');
          },
        );
    });
  });

  function assertGoodToken(accessToken, user) {
    if (accessToken instanceof AccessToken) {
      accessToken = accessToken.toJSON();
    }
    expect(accessToken.id, 'token id').to.have.lengthOf(64);
    expect(accessToken).to.have.property('userId', user.id);
    expect(accessToken).to.have.property('principalType', user.constructor.definition.name);
  }

  describe('User.logout', function() {
    it('logs out a user from user model 1 without logging out user from model 2',
      function() {
        let tokenOfOneUser;
        return Promise.all([
          OneUser.login(commonCredentials),
          AnotherUser.login(commonCredentials),
        ])
          .spread(function(t1, t2) {
            tokenOfOneUser = t1;
            return OneUser.logout(tokenOfOneUser.id);
          })
          .then(function() {
            return AccessToken.find({});
          })
          .then(function(allTokens) {
            const data = allTokens.map(function(token) {
              return {userId: token.userId, principalType: token.principalType};
            });
            expect(data).to.eql([
              // no token for userFromAnotherModel
              {userId: userFromAnotherModel.id, principalType: 'AnotherUser'},
            ]);
          });
      });
  });

  describe('Password Reset', function() {
    describe('User.resetPassword(options)', function() {
      const options = {
        email: 'foo@bar.com',
        redirect: 'http://foobar.com/reset-password',
      };

      it('creates a temp accessToken to allow a user to change password',
        function() {
          return Promise.all([
            OneUser.resetPassword({email: options.email}),
            waitForResetRequestAndVerify,
          ]);
        });

      function waitForResetRequestAndVerify() {
        return waitForEvent(OneUser, 'resetPasswordRequest')
          .then(function(info) {
            assertGoodToken(info.accessToken, userFromOneModel);
            return info.accessToken.user.getAsync();
          })
          .then(function(user) {
            expect(user).to.have.property('id', userFromOneModel.id);
            expect(user).to.have.property('email', userFromOneModel.email);
          });
      }
    });
  });

  describe('AccessToken (session) invalidation when changing email', function() {
    let anotherUserFromOneModel;

    it('impact only the related user', function() {
      return OneUser.create({email: 'original@example.com', password: 'bar'})
        .then(function(u) {
          anotherUserFromOneModel = u;
          return Promise.all([
            OneUser.login({email: 'original@example.com', password: 'bar'}),
            OneUser.login(commonCredentials),
            AnotherUser.login(commonCredentials),
          ]);
        })
        .then(function() {
          return anotherUserFromOneModel.updateAttribute('email', 'updated@example.com');
        })
        .then(function() {
          // we need to sort on principalType to ensure stability in results' order
          return AccessToken.find({'order': 'principalType ASC'});
        })
        .then(function(allTokens) {
          const data = allTokens.map(function(token) {
            return {userId: token.userId, principalType: token.principalType};
          });
          expect(data).to.eql([
            // no token for anotherUserFromOneModel
            {userId: userFromAnotherModel.id, principalType: 'AnotherUser'},
            {userId: userFromOneModel.id, principalType: 'OneUser'},
          ]);
        });
    });
  });

  describe('AccessContext', function() {
    let ThirdUser, userFromThirdModel, accessContext;

    beforeEach(function() {
      accessContext = new AccessContext({registry: OneUser.registry});
    });

    describe('getUser()', function() {
      it('returns user although principals contain non USER principals',
        function() {
          return Promise.try(function() {
            addToAccessContext([
              {type: Principal.ROLE},
              {type: Principal.APP},
              {type: Principal.SCOPE},
              {type: OneUser.modelName, id: userFromOneModel.id},
            ]);
            const user = accessContext.getUser();
            expect(user).to.eql({
              id: userFromOneModel.id,
              principalType: OneUser.modelName,
            });
          });
        });

      it('returns user although principals contain invalid principals',
        function() {
          return Promise.try(function() {
            addToAccessContext([
              {type: 'AccessToken'},
              {type: 'invalidModelName'},
              {type: OneUser.modelName, id: userFromOneModel.id},
            ]);
            const user = accessContext.getUser();
            expect(user).to.eql({
              id: userFromOneModel.id,
              principalType: OneUser.modelName,
            });
          });
        });

      it('supports any level of built-in User model inheritance',
        function() {
          ThirdUser = createUserModel(app, 'ThirdUser', {base: 'OneUser'});
          return ThirdUser.create(commonCredentials)
            .then(function(userFromThirdModel) {
              accessContext.addPrincipal(ThirdUser.modelName, userFromThirdModel.id);
              const user = accessContext.getUser();
              expect(user).to.eql({
                id: userFromThirdModel.id,
                principalType: ThirdUser.modelName,
              });
            });
        });
    });

    // helper
    function addToAccessContext(list) {
      list.forEach(function(principal) {
        expect(principal).to.exist();
        accessContext.addPrincipal(principal.type, principal.id);
      });
    }
  });

  describe('Role model', function() {
    this.timeout(10000);

    let RoleMapping, ACL, user;

    beforeEach(function() {
      ACL = app.registry.getModel('ACL');
      app.model(ACL, {dataSource: 'db'});

      RoleMapping = app.registry.getModel('RoleMapping');
      app.model(RoleMapping, {dataSource: 'db'});
    });

    describe('role.users()', function() {
      it('returns users when using custom user principalType', function() {
        return userRole.principals.create(
          {principalType: OneUser.modelName, principalId: userFromOneModel.id},
        )
          .then(function() {
            return userRole.users({where: {principalType: OneUser.modelName}});
          })
          .then(getIds)
          .then(function(userIds) {
            expect(userIds).to.eql([userFromOneModel.id]);
          });
      });

      it('returns empty array when using invalid principalType', function() {
        return userRole.principals.create(
          {principalType: 'invalidModelName', principalId: userFromOneModel.id},
        )
          .then(function() {
            return userRole.users({where: {principalType: 'invalidModelName'}});
          })
          .then(function(users) {
            expect(users).to.be.empty();
          });
      });
    });

    describe('principal.user()', function() {
      it('returns the correct user instance', function() {
        return userRole.principals.create(
          {principalType: OneUser.modelName, principalId: userFromOneModel.id},
        ).then(function(principal) {
          return principal.user();
        }).then(function(user) {
          expect(user).to.have.property('id', userFromOneModel.id);
        });
      });

      it('returns null when created with invalid principalType', function() {
        return userRole.principals.create(
          {principalType: 'invalidModelName', principalId: userFromOneModel.id},
        ).then(function(principal) {
          return principal.user();
        }).then(function(user) {
          expect(user).to.not.exist();
        });
      });
    });

    describe('isInRole() & getRole()', function() {
      beforeEach(function() {
        return userRole.principals.create({principalType: OneUser.modelName,
          principalId: userFromOneModel.id});
      });

      it('supports isInRole()', function() {
        return Role.isInRole('userRole', userOneBaseContext)
          .then(function(isInRole) {
            expect(isInRole).to.be.true();
          });
      });

      it('supports getRoles()', function() {
        return Role.getRoles(
          userOneBaseContext,
        ).then(function(roles) {
          expect(roles).to.eql([
            Role.AUTHENTICATED,
            Role.EVERYONE,
            userRole.id,
          ]);
        });
      });
    });

    describe('built-in role resolvers', function() {
      it('supports $authenticated', function() {
        return Role.isInRole(Role.AUTHENTICATED, userOneBaseContext)
          .then(function(isInRole) {
            expect(isInRole).to.be.true();
          });
      });

      it('supports $unauthenticated', function() {
        return Role.isInRole(Role.UNAUTHENTICATED, userOneBaseContext)
          .then(function(isInRole) {
            expect(isInRole).to.be.false();
          });
      });

      describe('$owner', function() {
        it('supports legacy behavior with relations', function() {
          const Album = app.registry.createModel('Album', {
            name: String,
            userId: Number,
          }, {
            relations: {
              user: {
                type: 'belongsTo',
                model: 'OneUser',
                foreignKey: 'userId',
              },
            },
          });
          app.model(Album, {dataSource: 'db'});

          return Album.create({name: 'album', userId: userFromOneModel.id})
            .then(function(album) {
              const validContext = {
                principalType: OneUser.modelName,
                principalId: userFromOneModel.id,
                model: Album,
                id: album.id,
              };
              return Role.isInRole(Role.OWNER, validContext);
            })
            .then(function(isOwner) {
              expect(isOwner).to.be.true();
            });
        });

        // With multiple users config, we cannot resolve a user based just on
        // his id, as many users from different models could have the same id.
        it('legacy behavior resolves false without belongsTo relation', function() {
          const Album = app.registry.createModel('Album', {
            name: String,
            userId: Number,
            owner: Number,
          });
          app.model(Album, {dataSource: 'db'});

          return Album.create({
            name: 'album',
            userId: userFromOneModel.id,
            owner: userFromOneModel.id,
          })
            .then(function(album) {
              const authContext = {
                principalType: OneUser.modelName,
                principalId: userFromOneModel.id,
                model: Album,
                id: album.id,
              };
              return Role.isInRole(Role.OWNER, authContext);
            })
            .then(function(isOwner) {
              expect(isOwner).to.be.false();
            });
        });

        it('legacy behavior resolves false if owner has incorrect principalType', function() {
          const Album = app.registry.createModel('Album', {
            name: String,
            userId: Number,
          }, {
            relations: {
              user: {
                type: 'belongsTo',
                model: 'OneUser',
                foreignKey: 'userId',
              },
            },
          });
          app.model(Album, {dataSource: 'db'});

          return Album.create({name: 'album', userId: userFromOneModel.id})
            .then(function(album) {
              const invalidPrincipalTypes = [
                'invalidContextName',
                'USER',
                AnotherUser.modelName,
              ];
              const invalidContexts = invalidPrincipalTypes.map(principalType => {
                return {
                  principalType,
                  principalId: userFromOneModel.id,
                  model: Album,
                  id: album.id,
                };
              });
              return Promise.map(invalidContexts, context => {
                return Role.isInRole(Role.OWNER, context)
                  .then(isOwner => {
                    return {
                      principalType: context.principalType,
                      isOwner,
                    };
                  });
              });
            })
            .then(result => {
              expect(result).to.eql([
                {principalType: 'invalidContextName', isOwner: false},
                {principalType: 'USER', isOwner: false},
                {principalType: AnotherUser.modelName, isOwner: false},
              ]);
            });
        });

        it.skip('resolves the owner using the corrent belongsTo relation',
          function() {
          // passing {ownerRelations: true} will enable the new $owner role resolver
          // with any belongsTo relation allowing to resolve truthy
            const Message = createModelWithOptions(
              'ModelWithAllRelations',
              {ownerRelations: true},
            );

            const messages = [
              {content: 'firstMessage', customerId: userFromOneModel.id},
              {
                content: 'secondMessage',
                customerId: userFromOneModel.id,
                shopKeeperId: userFromAnotherModel.id,
              },

              // this is the incriminated message where two foreignKeys have the
              // same id but points towards two different user models. Although
              // customers should come from userFromOneModel and shopKeeperIds should
              // come from userFromAnotherModel. The inverted situation still resolves
              // isOwner true for both the customer and the shopKeeper
              {
                content: 'thirdMessage',
                customerId: userFromAnotherModel.id,
                shopKeeperId: userFromOneModel.id,
              },

              {content: 'fourthMessage', customerId: userFromAnotherModel.id},
              {content: 'fifthMessage'},
            ];
            return Promise.map(messages, msg => {
              return Message.create(msg);
            })
              .then(messages => {
                return Promise.all([
                  isOwnerForMessage(userFromOneModel, messages[0]),
                  isOwnerForMessage(userFromAnotherModel, messages[0]),
                  isOwnerForMessage(userFromOneModel, messages[1]),
                  isOwnerForMessage(userFromAnotherModel, messages[1]),

                  isOwnerForMessage(userFromOneModel, messages[2]),
                  isOwnerForMessage(userFromAnotherModel, messages[2]),

                  isOwnerForMessage(userFromAnotherModel, messages[3]),
                  isOwnerForMessage(userFromOneModel, messages[4]),
                ]);
              })
              .then(result => {
                expect(result).to.eql([
                  {userFrom: 'OneUser', msg: 'firstMessage', isOwner: true},
                  {userFrom: 'AnotherUser', msg: 'firstMessage', isOwner: false},
                  {userFrom: 'OneUser', msg: 'secondMessage', isOwner: true},
                  {userFrom: 'AnotherUser', msg: 'secondMessage', isOwner: true},

                  // these 2 tests fail because we cannot resolve ownership with
                  // multiple owners on a single model instance with a classic
                  // belongsTo relation, we need to use belongsTo with polymorphic
                  // discriminator to distinguish between the 2 models
                  {userFrom: 'OneUser', msg: 'thirdMessage', isOwner: false},
                  {userFrom: 'AnotherUser', msg: 'thirdMessage', isOwner: false},

                  {userFrom: 'AnotherUser', msg: 'fourthMessage', isOwner: false},
                  {userFrom: 'OneUser', msg: 'fifthMessage', isOwner: false},
                ]);
              });
          });
      });

      // helpers
      function isOwnerForMessage(user, msg) {
        const accessContext = {
          principalType: user.constructor.modelName,
          principalId: user.id,
          model: msg.constructor,
          id: msg.id,
        };
        return Role.isInRole(Role.OWNER, accessContext)
          .then(isOwner => {
            return {
              userFrom: user.constructor.modelName,
              msg: msg.content,
              isOwner,
            };
          });
      }

      function createModelWithOptions(name, options) {
        const baseOptions = {
          relations: {
            sender: {
              type: 'belongsTo',
              model: 'OneUser',
              foreignKey: 'customerId',
            },
            receiver: {
              type: 'belongsTo',
              model: 'AnotherUser',
              foreignKey: 'shopKeeperId',
            },
          },
        };
        options = extend(baseOptions, options);
        const Model = app.registry.createModel(
          name,
          {content: String, senderType: String},
          options,
        );
        app.model(Model, {dataSource: 'db'});
        return Model;
      }
    });

    describe('isMappedToRole()', function() {
      beforeEach(function() {
        return userRole.principals.create(userOneBaseContext);
      });

      it('resolves user by id using custom user principalType', function() {
        return ACL.resolvePrincipal(OneUser.modelName, userFromOneModel.id)
          .then(function(principal) {
            expect(principal.id).to.eql(userFromOneModel.id);
          });
      });

      it('throws error with code \'INVALID_PRINCIPAL_TYPE\' when principalType is incorrect',
        function() {
          return ACL.resolvePrincipal('incorrectPrincipalType', userFromOneModel.id)
            .then(
              function onSuccess() {
                throw new Error('ACL.resolvePrincipal() should have failed');
              },
              function onError(err) {
                expect(err).to.have.property('statusCode', 400);
                expect(err).to.have.property('code', 'INVALID_PRINCIPAL_TYPE');
              },
            );
        });

      it('reports isMappedToRole by user.username using custom user principalType',
        function() {
          return ACL.isMappedToRole(OneUser.modelName, userFromOneModel.username, 'userRole')
            .then(function(isMappedToRole) {
              expect(isMappedToRole).to.be.true();
            });
        });
    });
  });

  describe('setPassword', () => {
    let resetToken;
    beforeEach(givenResetPasswordTokenForOneUser);

    it('sets password when the access token belongs to the user', () => {
      return supertest(app)
        .post('/OneUsers/reset-password')
        .set('Authorization', resetToken.id)
        .send({newPassword: 'new-pass'})
        .expect(204)
        .then(() => {
          return supertest(app)
            .post('/OneUsers/login')
            .send({email: commonCredentials.email, password: 'new-pass'})
            .expect(200);
        });
    });

    it('fails when the access token belongs to a different user mode', () => {
      logServerErrorsOtherThan(403, app);
      return supertest(app)
        .post('/AnotherUsers/reset-password')
        .set('Authorization', resetToken.id)
        .send({newPassword: 'new-pass'})
        .expect(403)
        .then(() => {
          return supertest(app)
            .post('/AnotherUsers/login')
            .send(commonCredentials)
            .expect(200);
        });
    });

    function givenResetPasswordTokenForOneUser() {
      return Promise.all([
        OneUser.resetPassword({email: commonCredentials.email}),
        waitForEvent(OneUser, 'resetPasswordRequest'),
      ])
        .spread((reset, info) => resetToken = info.accessToken);
    }
  });

  describe('changePassword', () => {
    let token;
    beforeEach(givenTokenForOneUser);

    it('changes password when the access token belongs to the user', () => {
      return supertest(app)
        .post('/OneUsers/change-password')
        .set('Authorization', token.id)
        .send({
          oldPassword: commonCredentials.password,
          newPassword: 'new-pass',
        })
        .expect(204)
        .then(() => {
          return supertest(app)
            .post('/OneUsers/login')
            .send({email: commonCredentials.email, password: 'new-pass'})
            .expect(200);
        });
    });

    it('fails when the access token belongs to a different user mode', () => {
      logServerErrorsOtherThan(403, app);
      return supertest(app)
        .post('/AnotherUsers/change-password')
        .set('Authorization', token.id)
        .send({
          oldPassword: commonCredentials.password,
          newPassword: 'new-pass',
        })
        .expect(403)
        .then(() => {
          return supertest(app)
            .post('/AnotherUsers/login')
            .send(commonCredentials)
            .expect(200);
        });
    });

    function givenTokenForOneUser() {
      return OneUser.login(commonCredentials).then(t => token = t);
    }
  });

  describe('authorization', () => {
    beforeEach(givenProductModelAllowingOnlyUserRoleAccess);

    it('allows users belonging to authorized role', () => {
      logServerErrorsOtherThan(200, app);
      return userFromOneModel.createAccessToken()
        .then(token => {
          return supertest(app)
            .get('/Products')
            .set('Authorization', token.id)
            .expect(200, []);
        });
    });

    it('rejects other users', () => {
      logServerErrorsOtherThan(401, app);
      return userFromAnotherModel.createAccessToken()
        .then(token => {
          return supertest(app)
            .get('/Products')
            .set('Authorization', token.id)
            .expect(401);
        });
    });

    function givenProductModelAllowingOnlyUserRoleAccess() {
      const Product = app.registry.createModel({
        name: 'Product',
        acls: [
          {
            'principalType': 'ROLE',
            'principalId': '$everyone',
            'permission': 'DENY',
          },
          {
            'principalType': 'ROLE',
            'principalId': userRole.name,
            'permission': 'ALLOW',
          },
        ],
      });
      app.model(Product, {dataSource: 'db'});

      return userRole.principals.create({
        principalType: OneUser.modelName,
        principalId: userFromOneModel.id,
      });
    }
  });

  // helpers
  function createUserModel(app, name, options) {
    const model = app.registry.createModel(Object.assign({name: name}, options));
    app.model(model, {dataSource: 'db'});
    model.setMaxListeners(0); // allow many User.afterRemote's to be called
    return model;
  }

  function waitForEvent(emitter, name) {
    return new Promise(function(resolve, reject) {
      emitter.once(name, resolve);
    });
  }

  function getIds(array) {
    return array.map(function(it) { return it.id; });
  }
});
