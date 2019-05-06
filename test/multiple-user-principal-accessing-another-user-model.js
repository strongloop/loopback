// Copyright IBM Corp. 2018,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const debug = require('debug')('test');
const loopback = require('../');
const waitForEvent = require('./helpers/wait-for-event');
const supertest = require('supertest');
const loggers = require('./helpers/error-loggers');
const logServerErrorsOtherThan = loggers.logServerErrorsOtherThan;
const logAllServerErrors = loggers.logAllServerErrors;

describe('One user model accessing another user model', () => {
  let app,
    Seller, Customer, Building, CustomAccessToken,
    seniorSeller, juniorSeller, customer,
    seniorToken, juniorToken, customerToken,
    building;

  /* Setup the following models and relations:
   *  - Seller extends User
   *  - Customer extends User
   *  - Building
   *  - CustomAccessToken belongs to Seller or Customer
   *  - Building belongs to Seller
   *  - Customer belongs to Seller
   */
  beforeEach(setupAppAndModels);

  /* Setup the following model instances:
   *  - seniorSeller + access token
   *  - juniorSeller + access token
   *  - customer owned by senior seller + access token
   *  - building owned by senior seller
   */
  beforeEach(setupModelInstances);

  context('seniorSeller', () => {
    it('can patch seniorSeller', () => {
      logAllServerErrors(app);

      return supertest(app).patch(`/Sellers/${seniorSeller.id}`)
        .set('Authorization', seniorToken.id)
        .send({name: 'updated name'})
        .expect(200);
    });

    it('cannot patch juniorSeller', () => {
      logServerErrorsOtherThan(401, app);

      return supertest(app).patch(`/Sellers/${juniorSeller.id}`)
        .set('Authorization', seniorToken.id)
        .send({name: 'updated name'})
        .expect(401);
    });

    it('can patch customer', () => {
      logAllServerErrors(app);

      return supertest(app).patch(`/Customers/${customer.id}`)
        .set('Authorization', seniorToken.id)
        .send({name: 'updated name'})
        .expect(200);
    });

    it('can retrieve buildings owned by seniorSeller', () => {
      logAllServerErrors(app);

      return supertest(app).get(`/buildings/${building.id}`)
        .set('Authorization', seniorToken.id)
        .expect(200);
    });
  });

  context('juniorSeller', () => {
    it('cannot patch seniorSeller', () => {
      logServerErrorsOtherThan(401, app);

      return supertest(app).patch(`/Sellers/${seniorToken.id}`)
        .set('Authorization', juniorToken.id)
        .send({name: 'updated name'})
        .expect(401);
    });

    it('can patch juniorSeller', () => {
      logAllServerErrors(app);

      return supertest(app).patch(`/Sellers/${juniorSeller.id}`)
        .set('Authorization', juniorToken.id)
        .send({name: 'updated name'})
        .expect(200);
    });

    it('cannot patch customer', () => {
      logServerErrorsOtherThan(401, app);

      return supertest(app).patch(`/Customers/${customer.id}`)
        .set('Authorization', juniorToken.id)
        .send({name: 'updated name'})
        .expect(401);
    });

    it('cannot retrieve buildings owned by seniorSeller', () => {
      logServerErrorsOtherThan(401, app);

      return supertest(app).get(`/buildings/${building.id}`)
        .set('Authorization', juniorToken.id)
        .expect(401);
    });
  });

  context('customer', () => {
    it('cannot patch seniorSeller', () => {
      logServerErrorsOtherThan(401, app);

      return supertest(app).patch(`/Sellers/${seniorSeller.id}`)
        .set('Authorization', customerToken.id)
        .send({name: 'updated name'})
        .expect(401);
    });

    it('cannnot patch juniorSeller', () => {
      logServerErrorsOtherThan(401, app);

      return supertest(app).patch(`/Sellers/${juniorSeller.id}`)
        .set('Authorization', customerToken.id)
        .send({name: 'updated name'})
        .expect(401);
    });

    it('can patch customer (own data)', () => {
      logAllServerErrors(app);

      return supertest(app).patch(`/Customers/${customer.id}`)
        .set('Authorization', customerToken.id)
        .send({name: 'updated name'})
        .expect(200);
    });

    it('cannot retrieve buildings owned by seniorSeller', () => {
      logServerErrorsOtherThan(401, app);

      return supertest(app).get(`/buildings/${building.id}`)
        .set('Authorization', customerToken.id)
        .expect(401);
    });
  });

  function setupAppAndModels() {
    app = loopback({localRegistry: true, loadBuiltinModels: true});
    app.set('_verifyAuthModelRelations', false);
    app.set('remoting', {rest: {handleErrors: false}});
    app.dataSource('db', {connector: 'memory'});

    Seller = app.registry.createModel({
      name: 'Seller',
      base: 'User',
      saltWorkFactor: 4,
      relations: {
        accessTokens: {
          type: 'hasMany',
          model: 'CustomAccessToken',
          polymorphic: {
            foreignKey: 'userId',
            discriminator: 'principalType',
          },
        },
        buildings: {
          type: 'hasMany',
          model: 'Building',
        },
        customers: {
          type: 'hasMany',
          model: 'Customer',
        },
      },
    });

    Customer = app.registry.createModel({
      name: 'Customer',
      base: 'User',
      saltWorkFactor: 4,
      relations: {
        accessTokens: {
          type: 'hasMany',
          model: 'CustomAccessToken',
          polymorphic: {
            foreignKey: 'userId',
            discriminator: 'principalType',
          },
        },
        seller: {
          type: 'belongsTo',
          model: 'Seller',
        },
      },
    });

    Building = app.registry.createModel({
      name: 'Building',
      properties: {
        name: {type: 'string', required: true},
      },
      relations: {
        seller: {
          type: 'belongsTo',
          model: 'Seller',
        },
      },
      acls: [
        {
          accessType: '*',
          principalType: 'ROLE',
          principalId: '$everyone',
          permission: 'DENY',
        },
        {
          accessType: '*',
          principalType: 'ROLE',
          principalId: '$owner',
          permission: 'ALLOW',
        },
      ],
    });

    CustomAccessToken = app.registry.createModel({
      name: 'CustomAccessToken',
      base: 'AccessToken',
      relations: {
        user: {
          type: 'belongsTo',
          idName: 'id',
          polymorphic: {
            idType: 'string',
            foreignKey: 'userId',
            discriminator: 'principalType',
          },
        },
      },
    });

    app.model(CustomAccessToken, {dataSource: 'db', public: false});
    app.model(Seller, {dataSource: 'db'});
    app.model(Customer, {dataSource: 'db'});
    app.model(Building, {dataSource: 'db'});

    const builtinModels = app.registry.modelBuilder.models;
    app.model(builtinModels.ACL, {dataSource: 'db', public: false});
    app.model(builtinModels.Role, {dataSource: 'db', public: false});
    app.model(builtinModels.RoleMapping, {dataSource: 'db', public: false});

    app.enableAuth();

    app.use(loopback.rest());
  }

  function setupModelInstances() {
    return Promise.all([
      Seller.create({email: 'seniorSeller@example.com', password: 'pass'}),
      Seller.create({email: 'juniorSeller@example.com', password: 'pass'}),
    ]).then((sellers) => {
      seniorSeller = sellers[0];
      juniorSeller = sellers[1];

      debug('seniorSeller', seniorSeller.toObject());
      debug('juniorSeller', juniorSeller.toObject());

      return seniorSeller.customers.create({
        email: 'customer@example.com',
        password: 'pass',
      });
    }).then(c => {
      customer = c;
      debug('Customer', customer.toObject());

      return Promise.all([
        seniorSeller.createAccessToken({}),
        juniorSeller.createAccessToken({}),
        customer.createAccessToken({}),
      ]);
    }).then(tokens => {
      seniorToken = tokens[0];
      juniorToken = tokens[1];
      customerToken = tokens[2];

      debug('seniorSeller token', seniorToken.toObject());
      debug('juniorSeller token', juniorToken.toObject());
      debug('customer token', customerToken.toObject());

      return seniorSeller.buildings.create({name: 'Test Building'});
    }).then(b => {
      building = b;
      debug('Building', b.toObject());
    });
  }
});
