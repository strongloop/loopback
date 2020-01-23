// Copyright IBM Corp. 2017,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const expect = require('./helpers/expect');
const loopback = require('../');
const Promise = require('bluebird');

describe('role-mapping model', function() {
  this.timeout(10000);

  let app, oneUser, anApp, aRole;
  const models = {};

  beforeEach(function() {
    app = loopback({localRegistry: true, loadBuiltinModels: true});
    app.dataSource('db', {connector: 'memory'});

    // setup models
    ['User', 'Role', 'RoleMapping', 'Application'].map(setupModel);

    // create generic instances
    return Promise.all([
      models.User.create({
        username: 'oneUser',
        email: 'user@email.com',
        password: 'password',
      }),
      models.Application.create({name: 'anApp'}),
      models.Role.create({name: 'aRole'}),
    ])
      .spread(function(u, a, r) {
        oneUser = u;
        anApp = a;
        aRole = r;
      });

    // helper
    function setupModel(modelName) {
      const model = app.registry.getModel(modelName);
      app.model(model, {dataSource: 'db'});
      models[modelName] = model;
    }
  });

  it('supports .user() with a callback', function(done) {
    models.RoleMapping.create(
      {principalType: 'USER', principalId: oneUser.id},
      function(err, mapping) {
        if (err) done(err);
        mapping.user(function(err, user) {
          if (err) done(err);
          expect(user.id).to.equal(oneUser.id);
          done();
        });
      },
    );
  });

  it('supports .user() returning a promise', function() {
    return models.RoleMapping.create({principalType: 'USER', principalId: oneUser.id})
      .then(function(mapping) {
        return mapping.user();
      })
      .then(function(user) {
        expect(user.id).to.equal(oneUser.id);
      });
  });

  it('supports .application() with a callback', function(done) {
    models.RoleMapping.create(
      {principalType: 'APP', principalId: anApp.id},
      function(err, mapping) {
        if (err) done(err);
        mapping.application(function(err, app) {
          if (err) done(err);
          expect(app.id).to.equal(anApp.id);
          done();
        });
      },
    );
  });

  it('supports .application() returning a promise', function() {
    return models.RoleMapping.create({principalType: 'APP', principalId: anApp.id})
      .then(function(mapping) {
        return mapping.application();
      })
      .then(function(app) {
        expect(app.id).to.equal(anApp.id);
      });
  });

  it('supports .childRole() with a callback', function(done) {
    models.RoleMapping.create(
      {principalType: 'ROLE', principalId: aRole.id},
      function(err, mapping) {
        if (err) done(err);
        mapping.childRole(function(err, role) {
          if (err) done(err);
          expect(role.id).to.equal(aRole.id);
          done();
        });
      },
    );
  });

  it('supports .childRole() returning a promise', function() {
    return models.RoleMapping.create({principalType: 'ROLE', principalId: aRole.id})
      .then(function(mapping) {
        return mapping.childRole();
      })
      .then(function(role) {
        expect(role.id).to.equal(aRole.id);
      });
  });
});
