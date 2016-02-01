var async = require('async');
var debug = require('debug')('test');
var extend = require('util')._extend;
var loopback = require('../');
var expect = require('chai').expect;
var supertest = require('supertest');

describe('Replication over REST', function() {
  var ALICE = { id: 'a', username: 'alice', email: 'a@t.io', password: 'p' };
  var PETER = { id: 'p', username: 'peter', email: 'p@t.io', password: 'p' };
  var EMERY = { id: 'e', username: 'emery', email: 'e@t.io', password: 'p' };

  var serverApp, serverUrl, ServerUser, ServerCar, serverCars;
  var aliceId, peterId, aliceToken, peterToken, emeryToken, request;
  var clientApp, LocalUser, LocalCar, RemoteUser, RemoteCar, clientCars;
  var conflictedCarId;

  before(setupServer);
  before(setupClient);
  beforeEach(seedServerData);
  beforeEach(seedClientData);

  describe('the replication scenario scaffolded for the tests', function() {
    describe('Car model', function() {
      it('rejects anonymous READ', function(done) {
        listCars().expect(401, done);
      });

      it('rejects anonymous WRITE', function(done) {
        createCar().expect(401, done);
      });

      it('allows EMERY to READ', function(done) {
        listCars()
          .set('Authorization', emeryToken)
          .expect(200, done);
      });

      it('denies EMERY to WRITE', function(done) {
        createCar()
          .set('Authorization', emeryToken)
          .expect(401, done);
      });

      it('allows ALICE to READ', function(done) {
        listCars()
          .set('Authorization', aliceToken)
          .expect(200, done);
      });

      it('denies ALICE to WRITE', function(done) {
        createCar()
          .set('Authorization', aliceToken)
          .expect(401, done);
      });

      it('allows PETER to READ', function(done) {
        listCars()
          .set('Authorization', peterToken)
          .expect(200, done);
      });

      it('allows PETER to WRITE', function(done) {
        createCar()
        .set('Authorization', peterToken)
        .expect(200, done);
      });

      function listCars() {
        return request.get('/Cars');
      }

      function createCar() {
        return request.post('/Cars').send({ model: 'a-model' });
      }
    });
  });

  describe('sync with model-level permissions', function() {
    describe('as anonymous user', function() {
      it('rejects pull from server', function(done) {
        RemoteCar.replicate(LocalCar, expectHttpError(401, done));
      });

      it('rejects push to the server', function(done) {
        LocalCar.replicate(RemoteCar, expectHttpError(401, done));
      });
    });

    describe('as user with READ-only permissions', function() {
      beforeEach(function() {
        setAccessToken(emeryToken);
      });

      it('rejects pull from server', function(done) {
        RemoteCar.replicate(LocalCar, expectHttpError(401, done));
      });

      it('rejects push to the server', function(done) {
        LocalCar.replicate(RemoteCar, expectHttpError(401, done));
      });
    });

    describe('as user with REPLICATE-only permissions', function() {
      beforeEach(function() {
        setAccessToken(aliceToken);
      });

      it('allows pull from server', function(done) {
        RemoteCar.replicate(LocalCar, function(err, conflicts, cps) {
          if (err) return done(err);
          if (conflicts.length) return done(conflictError(conflicts));

          LocalCar.find(function(err, list) {
            if (err) return done(err);
            expect(list.map(carToString)).to.include.members(serverCars);
            done();
          });
        });
      });

      it('rejects push to the server', function(done) {
        LocalCar.replicate(RemoteCar, expectHttpError(401, done));
      });
    });

    describe('as user with READ and WRITE permissions', function() {
      beforeEach(function() {
        setAccessToken(peterToken);
      });

      it('allows pull from server', function(done) {
        RemoteCar.replicate(LocalCar, function(err, conflicts, cps) {
          if (err) return done(err);
          if (conflicts.length) return done(conflictError(conflicts));

          LocalCar.find(function(err, list) {
            if (err) return done(err);
            expect(list.map(carToString)).to.include.members(serverCars);
            done();
          });
        });
      });

      it('allows push to the server', function(done) {
        LocalCar.replicate(RemoteCar, function(err, conflicts, cps) {
          if (err) return done(err);
          if (conflicts.length) return done(conflictError(conflicts));

          ServerCar.find(function(err, list) {
            if (err) return done(err);
            expect(list.map(carToString)).to.include.members(clientCars);
            done();
          });
        });
      });
    });
  });

  describe('conflict resolution with model-level permissions', function() {
    var LocalConflict, RemoteConflict;

    before(function setupConflictModels() {
      LocalConflict = LocalCar.getChangeModel().Conflict;
      RemoteConflict = RemoteCar.getChangeModel().Conflict;
    });

    beforeEach(seedConflict);

    describe('as anonymous user', function() {
      it('rejects resolve() on the client', function(done) {
        // simulate replication Client->Server
        var conflict = new LocalConflict(
          conflictedCarId,
          LocalCar,
          RemoteCar);
        conflict.resolveUsingSource(expectHttpError(401, done));
      });

      it('rejects resolve() on the server', function(done) {
        // simulate replication Server->Client
        var conflict = new RemoteConflict(
          conflictedCarId,
          RemoteCar,
          LocalCar);
        conflict.resolveUsingSource(expectHttpError(401, done));
      });
    });

    describe('as user with READ-only permissions', function() {
      beforeEach(function() {
        setAccessToken(emeryToken);
      });

      it('allows resolve() on the client', function(done) {
        // simulate replication Client->Server
        var conflict = new LocalConflict(
          conflictedCarId,
          LocalCar,
          RemoteCar);
        conflict.resolveUsingSource(done);
      });

      it('rejects resolve() on the server', function(done) {
        // simulate replication Server->Client
        var conflict = new RemoteConflict(
          conflictedCarId,
          RemoteCar,
          LocalCar);
        conflict.resolveUsingSource(expectHttpError(401, done));
      });
    });

    describe('as user with REPLICATE-only permissions', function() {
      beforeEach(function() {
        setAccessToken(aliceToken);
      });

      it('allows reverse resolve() on the client', function(done) {
        RemoteCar.replicate(LocalCar, function(err, conflicts) {
          if (err) return done(err);
          expect(conflicts, 'conflicts').to.have.length(1);

          // By default, conflicts are always resolved by modifying
          // the source datasource, so that the next replication run
          // replicates the resolved data.
          // However, when replicating changes from a datasource that
          // users are not authorized to change, the users have to resolve
          // conflicts at the target, discarding any changes made in
          // the target datasource only.
          conflicts[0].swapParties().resolveUsingTarget(function(err) {
            if (err) return done(err);

            RemoteCar.replicate(LocalCar, function(err, conflicts) {
              if (err) return done(err);
              if (conflicts.length) return done(conflictError(conflicts));
              done();
            });
          });
        });
      });

      it('rejects resolve() on the server', function(done) {
        RemoteCar.replicate(LocalCar, function(err, conflicts) {
          if (err) return done(err);
          expect(conflicts, 'conflicts').to.have.length(1);
          conflicts[0].resolveUsingSource(expectHttpError(401, done));
        });
      });
    });

    describe('as user with READ and WRITE permissions', function() {
      beforeEach(function() {
        setAccessToken(peterToken);
      });

      it('allows resolve() on the client', function(done) {
        LocalCar.replicate(RemoteCar, function(err, conflicts) {
          if (err) return done(err);
          expect(conflicts).to.have.length(1);

          conflicts[0].resolveUsingSource(function(err) {
            if (err) return done(err);
            LocalCar.replicate(RemoteCar, function(err, conflicts) {
              if (err) return done(err);
              if (conflicts.length) return done(conflictError(conflicts));
              done();
            });
          });
        });
      });

      it('allows resolve() on the server', function(done) {
        RemoteCar.replicate(LocalCar, function(err, conflicts) {
          if (err) return done(err);
          expect(conflicts).to.have.length(1);

          conflicts[0].resolveUsingSource(function(err) {
            if (err) return done(err);
            RemoteCar.replicate(LocalCar, function(err, conflicts) {
              if (err) return done(err);
              if (conflicts.length) return done(conflictError(conflicts));
              done();
            });
          });
        });
      });
    });
  });

  describe.skip('sync with instance-level permissions', function() {
    it('pulls only authorized records', function(done) {
      setAccessToken(aliceToken);
      RemoteUser.replicate(LocalUser, function(err, conflicts, cps) {
        if (err) return done(err);
        if (conflicts.length) return done(conflictError(conflicts));
        LocalUser.find(function(err, users) {
          var userNames = users.map(function(u) { return u.username; });
          expect(userNames).to.eql([ALICE.username]);
          done();
        });
      });
    });

    it('allows push of authorized records', function(done) {
      async.series([
        setupModifiedLocalCopyOfAlice,

        function replicateAsCurrentUser(next) {
          setAccessToken(aliceToken);
          LocalUser.replicate(RemoteUser, function(err, conflicts) {
            if (err) return next(err);
            if (conflicts.length) return next(conflictError(conflicts));
            next();
          });
        },

        function verify(next) {
          RemoteUser.findById(aliceId, function(err, found) {
            if (err) return next(err);
            expect(found.toObject())
              .to.have.property('fullname', 'Alice Smith');
            next();
          });
        }
      ], done);
    });

    it('rejects push of unauthorized records', function(done) {
      async.series([
        setupModifiedLocalCopyOfAlice,

        function replicateAsDifferentUser(next) {
          setAccessToken(peterToken);
          LocalUser.replicate(RemoteUser, function(err, conflicts) {
            if (!err)
              return next(new Error('Replicate should have failed.'));
            expect(err).to.have.property('statusCode', 401); // or 403?
            next();
          });
        },

        function verify(next) {
          ServerUser.findById(aliceId, function(err, found) {
            if (err) return next(err);
            expect(found.toObject())
              .to.not.have.property('fullname');
            next();
          });
        }
      ], done);
    });

    // TODO(bajtos) verify conflict resolution

    function setupModifiedLocalCopyOfAlice(done) {
      // Replicate directly, bypassing REST+AUTH layers
      replicateServerToLocal(function(err) {
        if (err) return done(err);

        LocalUser.updateAll(
          { id: aliceId },
          { fullname: 'Alice Smith' },
          done);
      });
    }
  });

  var USER_PROPS = {
    id: { type: 'string', id: true }
  };

  var USER_OPTS = {
    base: 'User',
    plural: 'Users', // use the same REST path in all models
    trackChanges: true,
    strict: 'throw',
    persistUndefinedAsNull: true
  };

  var CAR_PROPS = {
    id: { type: 'string', id: true, defaultFn: 'guid' },
    model: { type: 'string', required: true },
    maker: { type: 'string' }
  };

  var CAR_OPTS = {
    base: 'PersistedModel',
    plural: 'Cars', // use the same REST path in all models
    trackChanges: true,
    strict: 'throw',
    persistUndefinedAsNull: true,
    acls: [
      // disable anonymous access
      {
        principalType: 'ROLE',
        principalId: '$everyone',
        permission: 'DENY'
      },
      // allow all authenticated users to read data
      {
        principalType: 'ROLE',
        principalId: '$authenticated',
        permission: 'ALLOW',
        accessType: 'READ'
      },
      // allow Alice to pull changes
      {
        principalType: 'USER',
        principalId: ALICE.id,
        permission: 'ALLOW',
        accessType: 'REPLICATE'
      },
      // allow Peter to write data
      {
        principalType: 'USER',
        principalId: PETER.id,
        permission: 'ALLOW',
        accessType: 'WRITE'
      }
    ]
  };

  function setupServer(done) {
    serverApp = loopback();
    serverApp.enableAuth();

    serverApp.dataSource('db', { connector: 'memory' });

    // Setup a custom access-token model that is not shared
    // with the client app
    var ServerToken = loopback.createModel('ServerToken', {}, {
      base: 'AccessToken',
      relations: {
        user: {
          type: 'belongsTo',
          model: 'ServerUser',
          foreignKey: 'userId'
        }
      }
    });
    serverApp.model(ServerToken, { dataSource: 'db', public: false });
    serverApp.model(loopback.ACL, { dataSource: 'db', public: false });
    serverApp.model(loopback.Role, { dataSource: 'db', public: false });
    serverApp.model(loopback.RoleMapping, { dataSource: 'db', public: false });

    ServerUser = loopback.createModel('ServerUser', USER_PROPS, USER_OPTS);
    serverApp.model(ServerUser, {
      dataSource: 'db',
      public: true,
      relations: { accessTokens: { model: 'ServerToken' } }
    });

    ServerCar = loopback.createModel('ServerCar', CAR_PROPS, CAR_OPTS);
    serverApp.model(ServerCar, {  dataSource: 'db', public: true });

    serverApp.use(function(req, res, next) {
      debug(req.method + ' ' + req.path);
      next();
    });
    serverApp.use(loopback.token({ model: ServerToken }));
    serverApp.use(loopback.rest());

    serverApp.set('legacyExplorer', false);
    serverApp.set('port', 0);
    serverApp.set('host', '127.0.0.1');
    serverApp.listen(function() {
      serverUrl = serverApp.get('url').replace(/\/+$/, '');
      request = supertest(serverUrl);
      done();
    });
  }

  function setupClient() {
    clientApp = loopback();
    clientApp.dataSource('db', { connector: 'memory' });
    clientApp.dataSource('remote', {
      connector: 'remote',
      url: serverUrl
    });

    // NOTE(bajtos) At the moment, all models share the same Checkpoint
    // model. This causes the in-process replication to work differently
    // than client-server replication.
    // As a workaround, we manually setup unique Checkpoint for ClientModel.
    var ClientCheckpoint = loopback.Checkpoint.extend('ClientCheckpoint');
    ClientCheckpoint.attachTo(clientApp.dataSources.db);

    LocalUser = loopback.createModel('LocalUser', USER_PROPS, USER_OPTS);
    if (LocalUser.Change) LocalUser.Change.Checkpoint = ClientCheckpoint;
    clientApp.model(LocalUser, { dataSource: 'db' });

    LocalCar = loopback.createModel('LocalCar', CAR_PROPS, CAR_OPTS);
    LocalCar.Change.Checkpoint = ClientCheckpoint;
    clientApp.model(LocalCar, {  dataSource: 'db' });

    var remoteOpts = createRemoteModelOpts(USER_OPTS);
    RemoteUser = loopback.createModel('RemoteUser', USER_PROPS, remoteOpts);
    clientApp.model(RemoteUser, { dataSource: 'remote' });

    remoteOpts = createRemoteModelOpts(CAR_OPTS);
    RemoteCar = loopback.createModel('RemoteCar', CAR_PROPS, remoteOpts);
    clientApp.model(RemoteCar, {  dataSource: 'remote' });
  }

  function createRemoteModelOpts(modelOpts) {
    return extend(modelOpts, {
      // Disable change tracking, server will call rectify/rectifyAll
      // after each change, because it's tracking the changes too.
      trackChanges: false,
      // Enable remote replication in order to get remoting API metadata
      // used by the remoting connector
      enableRemoteReplication: true
    });
  }

  function seedServerData(done) {
    async.series([
      function(next) {
        serverApp.dataSources.db.automigrate(next);
      },
      function(next) {
        ServerUser.create([ALICE, PETER, EMERY], function(err, created) {
          if (err) return next(err);
          aliceId = created[0].id;
          peterId = created[1].id;
          next();
        });
      },
      function(next) {
        ServerUser.login(ALICE, function(err, token) {
          if (err) return next(err);
          aliceToken = token.id;

          ServerUser.login(PETER, function(err, token) {
            if (err) return next(err);
            peterToken = token.id;

            ServerUser.login(EMERY, function(err, token) {
              emeryToken = token.id;

              next();
            });
          });
        });
      },
      function(next) {
        ServerCar.create(
          [
            { id: 'Ford-Mustang',  maker: 'Ford', model: 'Mustang' },
            { id: 'Audi-R8', maker: 'Audi', model: 'R8' }
          ],
          function(err, cars) {
            if (err) return next(err);
            serverCars = cars.map(carToString);
            next();
          });
      }
    ], done);
  }

  function seedClientData(done) {
    async.series([
      function(next) {
        clientApp.dataSources.db.automigrate(next);
      },
      function(next) {
        LocalCar.create(
          [{ maker: 'Local', model: 'Custom' }],
          function(err, cars) {
            if (err) return next(err);
            clientCars = cars.map(carToString);
            next();
          });
      },
    ], done);
  }

  function seedConflict(done) {
    LocalCar.replicate(ServerCar, function(err, conflicts) {
      if (err) return done(err);
      if (conflicts.length) return done(conflictError(conflicts));
      ServerCar.replicate(LocalCar, function(err, conflicts) {
        if (err) return done(err);
        if (conflicts.length) return done(conflictError(conflicts));

        // Hard-coded, see the seed data above
        conflictedCarId = 'Ford-Mustang';

        new LocalCar({ id: conflictedCarId })
          .updateAttributes({ model: 'Client' }, function(err, c) {
            if (err) return done(err);
            new ServerCar({ id: conflictedCarId })
              .updateAttributes({ model: 'Server' }, done);
          });
      });
    });
  }

  function setAccessToken(token) {
    clientApp.dataSources.remote.connector.remotes.auth = {
      bearer: new Buffer(token).toString('base64'),
      sendImmediately: true
    };
  }

  function expectHttpError(code, done) {
    return function(err) {
      if (!err) return done(new Error('The method should have failed.'));
      expect(err).to.have.property('statusCode', code);
      done();
    };
  }

  function replicateServerToLocal(next) {
    ServerUser.replicate(LocalUser, function(err, conflicts) {
      if (err) return next(err);
      if (conflicts.length) return next(conflictError(conflicts));
      next();
    });
  }

  function conflictError(conflicts) {
    var err = new Error('Unexpected conflicts\n' +
      conflicts.map(JSON.stringify).join('\n'));
    err.name = 'ConflictError';
  }

  function carToString(c) {
    return c.maker ? c.maker + ' ' + c.model : c.model;
  }
});
