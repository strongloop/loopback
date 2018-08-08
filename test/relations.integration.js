// Copyright IBM Corp. 2013,2018. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var loopback = require('../');
var lt = require('./helpers/loopback-testing-helper');
var path = require('path');
var SIMPLE_APP = path.join(__dirname, 'fixtures', 'simple-integration-app');
var app = require(path.join(SIMPLE_APP, 'server/server.js'));
var assert = require('assert');
var expect = require('./helpers/expect');
var debug = require('debug')('loopback:test:relations.integration');
var async = require('async');

describe('relations - integration', function() {
  lt.beforeEach.withApp(app);

  lt.beforeEach.givenModel('store');
  beforeEach(function(done) {
    this.widgetName = 'foo';
    this.store.widgets.create({
      name: this.widgetName,
    }, function() {
      done();
    });
  });
  afterEach(function(done) {
    this.app.models.widget.destroyAll(done);
  });

  describe('polymorphicHasMany', function() {
    before(function defineProductAndCategoryModels() {
      var Team = app.registry.createModel('Team', {name: 'string'});
      var Reader = app.registry.createModel('Reader', {name: 'string'});
      var Picture = app.registry.createModel('Picture',
        {name: 'string', imageableId: 'number', imageableType: 'string'});

      app.model(Team, {dataSource: 'db'});
      app.model(Reader, {dataSource: 'db'});
      app.model(Picture, {dataSource: 'db'});

      Reader.hasMany(Picture, {polymorphic: { // alternative syntax
        as: 'imageable', // if not set, default to: reference
        foreignKey: 'imageableId', // defaults to 'as + Id'
        discriminator: 'imageableType', // defaults to 'as + Type'
      }});

      Picture.belongsTo('imageable', {polymorphic: {
        foreignKey: 'imageableId',
        discriminator: 'imageableType',
      }});

      Reader.belongsTo(Team);
    });

    before(function createEvent(done) {
      var test = this;
      app.models.Team.create({name: 'Team 1'},
        function(err, team) {
          if (err) return done(err);

          test.team = team;
          app.models.Reader.create({name: 'Reader 1'},
            function(err, reader) {
              if (err) return done(err);

              test.reader = reader;
              reader.pictures.create({name: 'Picture 1'});
              reader.pictures.create({name: 'Picture 2'});
              reader.team(test.team);
              reader.save(done);
            });
        });
    });

    after(function(done) {
      this.app.models.Reader.destroyAll(done);
    });

    it('includes the related child model', function(done) {
      var url = '/api/readers/' + this.reader.id;
      this.get(url)
        .query({'filter': {'include': 'pictures'}})
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.name).to.be.equal('Reader 1');
          expect(res.body.pictures).to.be.eql([
            {name: 'Picture 1', id: 1, imageableId: 1, imageableType: 'Reader'},
            {name: 'Picture 2', id: 2, imageableId: 1, imageableType: 'Reader'},
          ]);

          done();
        });
    });

    it('includes the related parent model', function(done) {
      var url = '/api/pictures';
      this.get(url)
        .query({'filter': {'include': 'imageable'}})
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body[0].name).to.be.equal('Picture 1');
          expect(res.body[1].name).to.be.equal('Picture 2');
          expect(res.body[0].imageable).to.be.eql({name: 'Reader 1', id: 1, teamId: 1});

          done();
        });
    });

    it('includes related models scoped to the related parent model', function(done) {
      var url = '/api/pictures';
      this.get(url)
        .query({'filter': {'include': {
          'relation': 'imageable',
          'scope': {'include': 'team'},
        }}})
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body[0].name).to.be.equal('Picture 1');
          expect(res.body[1].name).to.be.equal('Picture 2');
          expect(res.body[0].imageable.name).to.be.eql('Reader 1');
          expect(res.body[0].imageable.team).to.be.eql({name: 'Team 1', id: 1});

          done();
        });
    });
  });

  describe('/store/superStores', function() {
    it('should invoke scoped methods remotely', function(done) {
      this.get('/api/stores/superStores')
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.an('array');

          done();
        });
    });
  });

  describe('/store/:id/widgets', function() {
    beforeEach(function() {
      this.url = '/api/stores/' + this.store.id + '/widgets';
    });
    lt.describe.whenCalledRemotely('GET', '/api/stores/:id/widgets', function() {
      it('should succeed with statusCode 200', function() {
        assert.equal(this.res.statusCode, 200);
      });
      describe('widgets (response.body)', function() {
        beforeEach(function() {
          debug('GET /api/stores/:id/widgets response: %s' +
              '\nheaders: %j\nbody string: %s',
          this.res.statusCode,
          this.res.headers,
          this.res.text);
          this.widgets = this.res.body;
          this.widget = this.res.body && this.res.body[0];
        });
        it('should be an array', function() {
          assert(Array.isArray(this.widgets));
        });
        it('should include a single widget', function() {
          assert(this.widgets.length === 1);
          assert(this.widget);
        });
        it('should be a valid widget', function() {
          assert(this.widget.id);
          assert.equal(this.widget.storeId, this.store.id);
          assert.equal(this.widget.name, this.widgetName);
        });
      });
    });
    describe('POST /api/store/:id/widgets', function() {
      beforeEach(function() {
        this.newWidgetName = 'baz';
        this.newWidget = {
          name: this.newWidgetName,
        };
      });
      beforeEach(function(done) {
        this.http = this.post(this.url, this.newWidget);
        this.http.send(this.newWidget);
        this.http.end(function(err) {
          if (err) return done(err);

          this.req = this.http.req;
          this.res = this.http.response;

          done();
        }.bind(this));
      });
      it('should succeed with statusCode 200', function() {
        assert.equal(this.res.statusCode, 200);
      });
      describe('widget (response.body)', function() {
        beforeEach(function() {
          this.widget = this.res.body;
        });
        it('should be an object', function() {
          assert(typeof this.widget === 'object');
          assert(!Array.isArray(this.widget));
        });
        it('should be a valid widget', function() {
          assert(this.widget.id);
          assert.equal(this.widget.storeId, this.store.id);
          assert.equal(this.widget.name, this.newWidgetName);
        });
      });
      it('should have a single widget with storeId', function(done) {
        this.app.models.widget.count({
          storeId: this.store.id,
        }, function(err, count) {
          if (err) return done(err);

          assert.equal(count, 2);

          done();
        });
      });
    });

    describe('PUT /api/store/:id/widgets/:fk', function() {
      beforeEach(function(done) {
        var self = this;
        this.store.widgets.create({
          name: this.widgetName,
        }, function(err, widget) {
          self.widget = widget;
          self.url = '/api/stores/' + self.store.id + '/widgets/' + widget.id;
          done();
        });
      });
      it('does not add default properties to request body', function(done) {
        var self = this;
        self.request.put(self.url)
          .send({active: true})
          .end(function(err) {
            if (err) return done(err);
            app.models.Widget.findById(self.widget.id, function(err, w) {
              if (err) return done(err);
              expect(w.name).to.equal(self.widgetName);
              done();
            });
          });
      });
    });
  });

  describe('/stores/:id/widgets/:fk - 200', function() {
    beforeEach(function(done) {
      var self = this;
      this.store.widgets.create({
        name: this.widgetName,
      }, function(err, widget) {
        self.widget = widget;
        self.url = '/api/stores/' + self.store.id + '/widgets/' + widget.id;

        done();
      });
    });
    lt.describe.whenCalledRemotely('GET', '/stores/:id/widgets/:fk', function() {
      it('should succeed with statusCode 200', function() {
        assert.equal(this.res.statusCode, 200);
        assert.equal(this.res.body.id, this.widget.id);
      });
    });
  });

  describe('/stores/:id/widgets/:fk - 404', function() {
    beforeEach(function() {
      this.url = '/api/stores/' + this.store.id + '/widgets/123456';
    });
    lt.describe.whenCalledRemotely('GET', '/stores/:id/widgets/:fk', function() {
      it('should fail with statusCode 404', function() {
        assert.equal(this.res.statusCode, 404);
        assert.equal(this.res.body.error.statusCode, 404);
      });
    });
  });

  describe('/store/:id/widgets/count', function() {
    beforeEach(function() {
      this.url = '/api/stores/' + this.store.id + '/widgets/count';
    });
    lt.describe.whenCalledRemotely('GET', '/api/stores/:id/widgets/count', function() {
      it('should succeed with statusCode 200', function() {
        assert.equal(this.res.statusCode, 200);
      });
      it('should return the count', function() {
        assert.equal(this.res.body.count, 1);
      });
    });
  });

  describe('/store/:id/widgets/count - filtered (matches)', function() {
    beforeEach(function() {
      this.url = '/api/stores/' + this.store.id + '/widgets/count?where[name]=foo';
    });
    lt.describe.whenCalledRemotely('GET', '/api/stores/:id/widgets/count?where[name]=foo', function() {
      it('should succeed with statusCode 200', function() {
        assert.equal(this.res.statusCode, 200);
      });
      it('should return the count', function() {
        assert.equal(this.res.body.count, 1);
      });
    });
  });

  describe('/store/:id/widgets/count - filtered (no matches)', function() {
    beforeEach(function() {
      this.url = '/api/stores/' + this.store.id + '/widgets/count?where[name]=bar';
    });
    lt.describe.whenCalledRemotely('GET', '/api/stores/:id/widgets/count?where[name]=bar', function() {
      it('should succeed with statusCode 200', function() {
        assert.equal(this.res.statusCode, 200);
      });
      it('should return the count', function() {
        assert.equal(this.res.body.count, 0);
      });
    });
  });

  describe('/widgets/:id/store', function() {
    beforeEach(function(done) {
      var self = this;
      this.store.widgets.create({
        name: this.widgetName,
      }, function(err, widget) {
        self.widget = widget;
        self.url = '/api/widgets/' + self.widget.id + '/store';

        done();
      });
    });
    lt.describe.whenCalledRemotely('GET', '/api/widgets/:id/store', function() {
      it('should succeed with statusCode 200', function() {
        assert.equal(this.res.statusCode, 200);
        assert.equal(this.res.body.id, this.store.id);
      });
    });
  });

  describe('hasMany through', function() {
    function setup(connecting, cb) {
      var root = {};

      async.series([
        // Clean up models
        function(done) {
          app.models.physician.destroyAll(function(err) {
            app.models.patient.destroyAll(function(err) {
              app.models.appointment.destroyAll(function(err) {
                done();
              });
            });
          });
        },

        // Create a physician
        function(done) {
          app.models.physician.create({
            name: 'ph1',
          }, function(err, physician) {
            root.physician = physician;

            done();
          });
        },

        // Create a patient
        connecting ? function(done) {
          root.physician.patients.create({
            name: 'pa1',
          }, function(err, patient) {
            root.patient = patient;
            root.relUrl = '/api/physicians/' + root.physician.id +
              '/patients/rel/' + root.patient.id;

            done();
          });
        } : function(done) {
          app.models.patient.create({
            name: 'pa1',
          }, function(err, patient) {
            root.patient = patient;
            root.relUrl = '/api/physicians/' + root.physician.id +
              '/patients/rel/' + root.patient.id;

            done();
          });
        }], function(err, done) {
        cb(err, root);
      });
    }

    describe('PUT /physicians/:id/patients/rel/:fk', function() {
      before(function(done) {
        var self = this;
        setup(false, function(err, root) {
          self.url = root.relUrl;
          self.patient = root.patient;
          self.physician = root.physician;

          done(err);
        });
      });

      lt.describe.whenCalledRemotely('PUT', '/api/physicians/:id/patients/rel/:fk', function() {
        it('should succeed with statusCode 200', function() {
          assert.equal(this.res.statusCode, 200);
          assert.equal(this.res.body.patientId, this.patient.id);
          assert.equal(this.res.body.physicianId, this.physician.id);
        });

        it('should create a record in appointment', function(done) {
          var self = this;
          app.models.appointment.find(function(err, apps) {
            assert.equal(apps.length, 1);
            assert.equal(apps[0].patientId, self.patient.id);

            done();
          });
        });

        it('should connect physician to patient', function(done) {
          var self = this;
          self.physician.patients(function(err, patients) {
            assert.equal(patients.length, 1);
            assert.equal(patients[0].id, self.patient.id);

            done();
          });
        });
      });
    });

    describe('PUT /physicians/:id/patients/rel/:fk with data', function() {
      before(function(done) {
        var self = this;
        setup(false, function(err, root) {
          self.url = root.relUrl;
          self.patient = root.patient;
          self.physician = root.physician;

          done(err);
        });
      });

      var NOW = Date.now();
      var data = {date: new Date(NOW)};

      lt.describe.whenCalledRemotely('PUT', '/api/physicians/:id/patients/rel/:fk', data, function() {
        it('should succeed with statusCode 200', function() {
          assert.equal(this.res.statusCode, 200);
          assert.equal(this.res.body.patientId, this.patient.id);
          assert.equal(this.res.body.physicianId, this.physician.id);
          assert.equal(new Date(this.res.body.date).getTime(), NOW);
        });

        it('should create a record in appointment', function(done) {
          var self = this;
          app.models.appointment.find(function(err, apps) {
            assert.equal(apps.length, 1);
            assert.equal(apps[0].patientId, self.patient.id);
            assert.equal(apps[0].physicianId, self.physician.id);
            assert.equal(apps[0].date.getTime(), NOW);

            done();
          });
        });

        it('should connect physician to patient', function(done) {
          var self = this;
          self.physician.patients(function(err, patients) {
            assert.equal(patients.length, 1);
            assert.equal(patients[0].id, self.patient.id);

            done();
          });
        });
      });
    });

    describe('HEAD /physicians/:id/patients/rel/:fk', function() {
      before(function(done) {
        var self = this;
        setup(true, function(err, root) {
          self.url = root.relUrl;
          self.patient = root.patient;
          self.physician = root.physician;

          done(err);
        });
      });

      lt.describe.whenCalledRemotely('HEAD', '/api/physicians/:id/patients/rel/:fk', function() {
        it('should succeed with statusCode 200', function() {
          assert.equal(this.res.statusCode, 200);
        });
      });
    });

    describe('HEAD /physicians/:id/patients/rel/:fk that does not exist', function() {
      before(function(done) {
        var self = this;
        setup(true, function(err, root) {
          self.url = '/api/physicians/' + root.physician.id +
            '/patients/rel/' + '999';
          self.patient = root.patient;
          self.physician = root.physician;

          done(err);
        });
      });

      lt.describe.whenCalledRemotely('HEAD', '/api/physicians/:id/patients/rel/:fk', function() {
        it('should succeed with statusCode 404', function() {
          assert.equal(this.res.statusCode, 404);
        });
      });
    });

    describe('DELETE /physicians/:id/patients/rel/:fk', function() {
      before(function(done) {
        var self = this;
        setup(true, function(err, root) {
          self.url = root.relUrl;
          self.patient = root.patient;
          self.physician = root.physician;

          done(err);
        });
      });

      it('should create a record in appointment', function(done) {
        var self = this;
        app.models.appointment.find(function(err, apps) {
          assert.equal(apps.length, 1);
          assert.equal(apps[0].patientId, self.patient.id);

          done();
        });
      });

      it('should connect physician to patient', function(done) {
        var self = this;
        self.physician.patients(function(err, patients) {
          assert.equal(patients.length, 1);
          assert.equal(patients[0].id, self.patient.id);

          done();
        });
      });

      lt.describe.whenCalledRemotely('DELETE', '/api/physicians/:id/patients/rel/:fk', function() {
        it('should succeed with statusCode 204', function() {
          assert.equal(this.res.statusCode, 204);
        });

        it('should remove the record in appointment', function(done) {
          var self = this;
          app.models.appointment.find(function(err, apps) {
            assert.equal(apps.length, 0);

            done();
          });
        });

        it('should remove the connection between physician and patient', function(done) {
          var self = this;
          // Need to refresh the cache
          self.physician.patients(true, function(err, patients) {
            assert.equal(patients.length, 0);

            done();
          });
        });
      });
    });

    describe('GET /physicians/:id/patients/:fk', function() {
      before(function(done) {
        var self = this;
        setup(true, function(err, root) {
          self.url = '/api/physicians/' + root.physician.id +
            '/patients/' + root.patient.id;
          self.patient = root.patient;
          self.physician = root.physician;

          done(err);
        });
      });

      lt.describe.whenCalledRemotely('GET', '/api/physicians/:id/patients/:fk', function() {
        it('should succeed with statusCode 200', function() {
          assert.equal(this.res.statusCode, 200);
          assert.equal(this.res.body.id, this.physician.id);
        });
      });
    });

    describe('DELETE /physicians/:id/patients/:fk', function() {
      before(function(done) {
        var self = this;
        setup(true, function(err, root) {
          self.url = '/api/physicians/' + root.physician.id +
            '/patients/' + root.patient.id;
          self.patient = root.patient;
          self.physician = root.physician;

          done(err);
        });
      });

      lt.describe.whenCalledRemotely('DELETE', '/api/physicians/:id/patients/:fk', function() {
        it('should succeed with statusCode 204', function() {
          assert.equal(this.res.statusCode, 204);
        });

        it('should remove the record in appointment', function(done) {
          var self = this;
          app.models.appointment.find(function(err, apps) {
            assert.equal(apps.length, 0);

            done();
          });
        });

        it('should remove the connection between physician and patient', function(done) {
          var self = this;
          // Need to refresh the cache
          self.physician.patients(true, function(err, patients) {
            assert.equal(patients.length, 0);

            done();
          });
        });

        it('should remove the record in patient', function(done) {
          var self = this;
          app.models.patient.find(function(err, patients) {
            assert.equal(patients.length, 0);

            done();
          });
        });
      });
    });
  });

  describe('hasAndBelongsToMany', function() {
    beforeEach(function defineProductAndCategoryModels() {
      // Disable "Warning: overriding remoting type product"
      this.app.remotes()._typeRegistry._options.warnWhenOverridingType = false;

      var product = app.registry.createModel(
        'product',
        {id: 'string', name: 'string'}
      );
      var category = app.registry.createModel(
        'category',
        {id: 'string', name: 'string'}
      );
      app.model(product, {dataSource: 'db'});
      app.model(category, {dataSource: 'db'});

      product.hasAndBelongsToMany(category);
      category.hasAndBelongsToMany(product);
    });

    lt.beforeEach.givenModel('category');

    beforeEach(function createProductsInCategory(done) {
      var test = this;
      this.category.products.create({
        name: 'a-product',
      }, function(err, product) {
        if (err) return done(err);

        test.product = product;

        done();
      });
    });

    beforeEach(function createAnotherCategoryAndProduct(done) {
      app.models.category.create({name: 'another-category'},
        function(err, cat) {
          if (err) return done(err);

          cat.products.create({name: 'another-product'}, done);
        });
    });

    afterEach(function(done) {
      this.app.models.product.destroyAll(done);
    });

    it.skip('allows to find related objects via where filter', function(done) {
      // TODO https://github.com/strongloop/loopback-datasource-juggler/issues/94
      var expectedProduct = this.product;
      this.get('/api/products?filter[where][categoryId]=' + this.category.id)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.eql([
            {
              id: expectedProduct.id,
              name: expectedProduct.name,
            },
          ]);

          done();
        });
    });

    it('allows to find related object via URL scope', function(done) {
      var expectedProduct = this.product;
      this.get('/api/categories/' + this.category.id + '/products')
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.eql([
            {
              id: expectedProduct.id,
              name: expectedProduct.name,
            },
          ]);

          done();
        });
    });

    it('includes requested related models in `find`', function(done) {
      var expectedProduct = this.product;
      var url = '/api/categories/findOne?filter[where][id]=' +
        this.category.id + '&filter[include]=products';

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.have.property('products');
          expect(res.body.products).to.eql([
            {
              id: expectedProduct.id,
              name: expectedProduct.name,
            },
          ]);

          done();
        });
    });

    it.skip('includes requested related models in `findById`', function(done) {
      // TODO https://github.com/strongloop/loopback-datasource-juggler/issues/93
      var expectedProduct = this.product;
      // Note: the URL format is not final
      var url = '/api/categories/' + this.category.id + '?include=products';

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.have.property('products');
          expect(res.body.products).to.eql([
            {
              id: expectedProduct.id,
              name: expectedProduct.name,
            },
          ]);

          done();
        });
    });
  });

  describe('embedsOne', function() {
    before(function defineGroupAndPosterModels() {
      var group = app.registry.createModel(
        'group',
        {name: 'string'},
        {plural: 'groups'}
      );
      app.model(group, {dataSource: 'db'});

      var poster = app.registry.createModel(
        'poster',
        {url: 'string'}
      );
      app.model(poster, {dataSource: 'db'});

      group.embedsOne(poster, {as: 'cover'});
    });

    before(function createImage(done) {
      var test = this;
      app.models.group.create({name: 'Group 1'},
        function(err, group) {
          if (err) return done(err);

          test.group = group;

          done();
        });
    });

    after(function(done) {
      this.app.models.group.destroyAll(done);
    });

    it('creates an embedded model', function(done) {
      var url = '/api/groups/' + this.group.id + '/cover';

      this.post(url)
        .send({url: 'http://image.url'})
        .expect(200, function(err, res) {
          expect(res.body).to.be.eql(
            {url: 'http://image.url'}
          );

          done();
        });
    });

    it('includes the embedded models', function(done) {
      var url = '/api/groups/' + this.group.id;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.name).to.be.equal('Group 1');
          expect(res.body.poster).to.be.eql(
            {url: 'http://image.url'}
          );

          done();
        });
    });

    it('returns the embedded model', function(done) {
      var url = '/api/groups/' + this.group.id + '/cover';

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql(
            {url: 'http://image.url'}
          );

          done();
        });
    });

    it('updates an embedded model', function(done) {
      var url = '/api/groups/' + this.group.id + '/cover';

      this.put(url)
        .send({url: 'http://changed.url'})
        .expect(200, function(err, res) {
          expect(res.body.url).to.be.equal('http://changed.url');

          done();
        });
    });

    it('returns the updated embedded model', function(done) {
      var url = '/api/groups/' + this.group.id + '/cover';

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql(
            {url: 'http://changed.url'}
          );

          done();
        });
    });

    it('deletes an embedded model', function(done) {
      var url = '/api/groups/' + this.group.id + '/cover';
      this.del(url).expect(204, done);
    });

    it('deleted the embedded model', function(done) {
      var url = '/api/groups/' + this.group.id + '/cover';
      this.get(url).expect(404, done);
    });
  });

  describe('embedsMany', function() {
    before(function defineProductAndCategoryModels() {
      var todoList = app.registry.createModel(
        'todoList',
        {name: 'string'},
        {plural: 'todo-lists'}
      );
      app.model(todoList, {dataSource: 'db'});

      var todoItem = app.registry.createModel(
        'todoItem',
        {content: 'string'}, {forceId: false}
      );
      app.model(todoItem, {dataSource: 'db'});

      todoList.embedsMany(todoItem, {as: 'items'});
    });

    before(function createTodoList(done) {
      var test = this;
      app.models.todoList.create({name: 'List A'},
        function(err, list) {
          if (err) return done(err);

          test.todoList = list;
          list.items.build({content: 'Todo 1'});
          list.items.build({content: 'Todo 2'});
          list.save(done);
        });
    });

    after(function(done) {
      this.app.models.todoList.destroyAll(done);
    });

    it('includes the embedded models', function(done) {
      var url = '/api/todo-lists/' + this.todoList.id;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.name).to.be.equal('List A');
          expect(res.body.todoItems).to.be.eql([
            {content: 'Todo 1', id: 1},
            {content: 'Todo 2', id: 2},
          ]);

          done();
        });
    });

    it('returns the embedded models', function(done) {
      var url = '/api/todo-lists/' + this.todoList.id + '/items';

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql([
            {content: 'Todo 1', id: 1},
            {content: 'Todo 2', id: 2},
          ]);

          done();
        });
    });

    it('filters the embedded models', function(done) {
      var url = '/api/todo-lists/' + this.todoList.id + '/items';
      url += '?filter[where][id]=2';

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql([
            {content: 'Todo 2', id: 2},
          ]);

          done();
        });
    });

    it('creates embedded models', function(done) {
      var url = '/api/todo-lists/' + this.todoList.id + '/items';

      var expected = {content: 'Todo 3', id: 3};

      this.post(url)
        .send({content: 'Todo 3'})
        .expect(200, function(err, res) {
          expect(res.body).to.be.eql(expected);

          done();
        });
    });

    it('includes the created embedded model', function(done) {
      var url = '/api/todo-lists/' + this.todoList.id + '/items';

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql([
            {content: 'Todo 1', id: 1},
            {content: 'Todo 2', id: 2},
            {content: 'Todo 3', id: 3},
          ]);

          done();
        });
    });

    it('returns an embedded model by (internal) id', function(done) {
      var url = '/api/todo-lists/' + this.todoList.id + '/items/3';

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql(
            {content: 'Todo 3', id: 3}
          );

          done();
        });
    });

    it('removes an embedded model', function(done) {
      var expectedProduct = this.product;
      var url = '/api/todo-lists/' + this.todoList.id + '/items/2';

      this.del(url)
        .expect(200, function(err, res) {
          done();
        });
    });

    it('returns the embedded models - verify', function(done) {
      var url = '/api/todo-lists/' + this.todoList.id + '/items';

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql([
            {content: 'Todo 1', id: 1},
            {content: 'Todo 3', id: 3},
          ]);

          done();
        });
    });

    it('returns a 404 response when embedded model is not found', function(done) {
      var url = '/api/todo-lists/' + this.todoList.id + '/items/2';
      this.get(url).expect(404, function(err, res) {
        if (err) return done(err);

        expect(res.body.error.status).to.be.equal(404);
        expect(res.body.error.message).to.be.equal('Unknown "todoItem" id "2".');
        expect(res.body.error.code).to.be.equal('MODEL_NOT_FOUND');

        done();
      });
    });

    it.skip('checks if an embedded model exists - ok', function(done) {
      var url = '/api/todo-lists/' + this.todoList.id + '/items/3';

      this.head(url)
        .expect(200, function(err, res) {
          done();
        });
    });

    it.skip('checks if an embedded model exists - fail', function(done) {
      var url = '/api/todo-lists/' + this.todoList.id + '/items/2';

      this.head(url)
        .expect(404, function(err, res) {
          done();
        });
    });
  });

  describe('referencesMany', function() {
    before(function defineProductAndCategoryModels() {
      var recipe = app.registry.createModel(
        'recipe',
        {name: 'string'}
      );
      app.model(recipe, {dataSource: 'db'});

      var ingredient = app.registry.createModel(
        'ingredient',
        {name: 'string'}
      );
      app.model(ingredient, {dataSource: 'db'});

      var photo = app.registry.createModel(
        'photo',
        {name: 'string'}
      );
      app.model(photo, {dataSource: 'db'});

      recipe.referencesMany(ingredient);
      // contrived example for test:
      recipe.hasOne(photo, {as: 'picture', options: {
        http: {path: 'image'},
      }});
    });

    before(function createRecipe(done) {
      var test = this;
      app.models.recipe.create({name: 'Recipe'},
        function(err, recipe) {
          if (err) return done(err);

          test.recipe = recipe;
          recipe.ingredients.create({
            name: 'Chocolate'},
          function(err, ing) {
            test.ingredient1 = ing.id;
            recipe.picture.create({name: 'Photo 1'}, done);
          });
        });
    });

    before(function createIngredient(done) {
      var test = this;
      app.models.ingredient.create({name: 'Sugar'}, function(err, ing) {
        test.ingredient2 = ing.id;

        done();
      });
    });

    after(function(done) {
      var app = this.app;
      app.models.recipe.destroyAll(function() {
        app.models.ingredient.destroyAll(function() {
          app.models.photo.destroyAll(done);
        });
      });
    });

    it('keeps an array of ids', function(done) {
      var url = '/api/recipes/' + this.recipe.id;
      var test = this;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.ingredientIds).to.eql([test.ingredient1]);
          expect(res.body).to.not.have.property('ingredients');

          done();
        });
    });

    it('creates referenced models', function(done) {
      var url = '/api/recipes/' + this.recipe.id + '/ingredients';
      var test = this;

      this.post(url)
        .send({name: 'Butter'})
        .expect(200, function(err, res) {
          expect(res.body.name).to.be.eql('Butter');
          test.ingredient3 = res.body.id;

          done();
        });
    });

    it('has created models', function(done) {
      var url = '/api/ingredients';
      var test = this;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql([
            {name: 'Chocolate', id: test.ingredient1},
            {name: 'Sugar', id: test.ingredient2},
            {name: 'Butter', id: test.ingredient3},
          ]);

          done();
        });
    });

    it('returns the referenced models', function(done) {
      var url = '/api/recipes/' + this.recipe.id + '/ingredients';
      var test = this;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql([
            {name: 'Chocolate', id: test.ingredient1},
            {name: 'Butter', id: test.ingredient3},
          ]);

          done();
        });
    });

    it('filters the referenced models', function(done) {
      var url = '/api/recipes/' + this.recipe.id + '/ingredients';
      url += '?filter[where][name]=Butter';
      var test = this;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql([
            {name: 'Butter', id: test.ingredient3},
          ]);

          done();
        });
    });

    it('includes the referenced models', function(done) {
      var url = '/api/recipes/findOne?filter[where][id]=' + this.recipe.id;
      url += '&filter[include]=ingredients';
      var test = this;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.ingredientIds).to.eql([
            test.ingredient1, test.ingredient3,
          ]);
          expect(res.body.ingredients).to.eql([
            {name: 'Chocolate', id: test.ingredient1},
            {name: 'Butter', id: test.ingredient3},
          ]);

          done();
        });
    });

    it('returns a referenced model by id', function(done) {
      var url = '/api/recipes/' + this.recipe.id + '/ingredients/';
      url += this.ingredient3;
      var test = this;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql(
            {name: 'Butter', id: test.ingredient3}
          );

          done();
        });
    });

    it('keeps an array of ids - verify', function(done) {
      var url = '/api/recipes/' + this.recipe.id;
      var test = this;

      var expected = [test.ingredient1, test.ingredient3];

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.ingredientIds).to.eql(expected);
          expect(res.body).to.not.have.property('ingredients');

          done();
        });
    });

    it('destroys a referenced model', function(done) {
      var expectedProduct = this.product;
      var url = '/api/recipes/' + this.recipe.id + '/ingredients/';
      url += this.ingredient3;

      this.del(url)
        .expect(200, function(err, res) {
          done();
        });
    });

    it('has destroyed a referenced model', function(done) {
      var url = '/api/ingredients';
      var test = this;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql([
            {name: 'Chocolate', id: test.ingredient1},
            {name: 'Sugar', id: test.ingredient2},
          ]);

          done();
        });
    });

    it('returns the referenced models without the deleted one', function(done) {
      var url = '/api/recipes/' + this.recipe.id + '/ingredients';
      var test = this;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql([
            {name: 'Chocolate', id: test.ingredient1},
          ]);

          done();
        });
    });

    it('creates/links a reference by id', function(done) {
      var url = '/api/recipes/' + this.recipe.id + '/ingredients';
      url += '/rel/' + this.ingredient2;
      var test = this;

      this.put(url)
        .expect(200, function(err, res) {
          expect(res.body).to.be.eql(
            {name: 'Sugar', id: test.ingredient2}
          );

          done();
        });
    });

    it('returns the referenced models - verify', function(done) {
      var url = '/api/recipes/' + this.recipe.id + '/ingredients';
      var test = this;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql([
            {name: 'Chocolate', id: test.ingredient1},
            {name: 'Sugar', id: test.ingredient2},
          ]);

          done();
        });
    });

    it('removes/unlinks a reference by id', function(done) {
      var url = '/api/recipes/' + this.recipe.id + '/ingredients';
      url += '/rel/' + this.ingredient1;
      var test = this;

      this.del(url)
        .expect(200, function(err, res) {
          done();
        });
    });

    it('returns the referenced models without the unlinked one', function(done) {
      var url = '/api/recipes/' + this.recipe.id + '/ingredients';
      var test = this;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql([
            {name: 'Sugar', id: test.ingredient2},
          ]);

          done();
        });
    });

    it('has not destroyed an unlinked model', function(done) {
      var url = '/api/ingredients';
      var test = this;

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.eql([
            {name: 'Chocolate', id: test.ingredient1},
            {name: 'Sugar', id: test.ingredient2},
          ]);

          done();
        });
    });

    it('uses a custom relation path', function(done) {
      var url = '/api/recipes/' + this.recipe.id + '/image';

      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(err).to.not.exist();
          expect(res.body.name).to.equal('Photo 1');

          done();
        });
    });

    it.skip('checks if a referenced model exists - ok', function(done) {
      var url = '/api/recipes/' + this.recipe.id + '/ingredients/';
      url += this.ingredient1;

      this.head(url)
        .expect(200, function(err, res) {
          done();
        });
    });

    it.skip('checks if an referenced model exists - fail', function(done) {
      var url = '/api/recipes/' + this.recipe.id + '/ingredients/';
      url += this.ingredient3;

      this.head(url)
        .expect(404, function(err, res) {
          done();
        });
    });
  });

  describe('nested relations', function() {
    let accessOptions;

    before(function defineModels() {
      var Book = app.registry.createModel(
        'Book',
        {name: 'string'},
        {plural: 'books'}
      );
      app.model(Book, {dataSource: 'db'});

      var Page = app.registry.createModel(
        'Page',
        {name: 'string'},
        {plural: 'pages'}
      );
      app.model(Page, {dataSource: 'db'});

      var Image = app.registry.createModel(
        'Image',
        {name: 'string'},
        {plural: 'images'}
      );
      app.model(Image, {dataSource: 'db'});

      var Note = app.registry.createModel(
        'Note',
        {text: 'string'},
        {plural: 'notes'}
      );
      app.model(Note, {dataSource: 'db'});

      var Chapter = app.registry.createModel(
        'Chapter',
        {name: 'string'},
        {plural: 'chapters'}
      );
      app.model(Chapter, {dataSource: 'db'});

      Book.hasMany(Page, {options: {nestRemoting: true}});
      Book.hasMany(Chapter);
      Page.hasMany(Note);
      Page.belongsTo(Book, {options: {nestRemoting: true}});
      Chapter.hasMany(Note);
      Image.belongsTo(Book);

      // fake a remote method that match the filter in Model.nestRemoting()
      Page.prototype['__throw__errors'] = function() {
        throw new Error('This should not crash the app');
      };

      Page.remoteMethod('__throw__errors', {isStatic: false, http: {path: '/throws', verb: 'get'},
        accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}]});

      // Now `pages` has nestRemoting set to true and no need to call nestRemoting()
      // Book.nestRemoting('pages');
      Book.nestRemoting('chapters');
      Image.nestRemoting('book');

      expect(Book.prototype['__findById__pages']).to.be.a('function');
      expect(Image.prototype['__get__book']).to.be.a('function');

      Page.beforeRemote('prototype.__findById__notes', function(ctx, result, next) {
        ctx.res.set('x-before', 'before');

        next();
      });

      Page.afterRemote('prototype.__findById__notes', function(ctx, result, next) {
        ctx.res.set('x-after', 'after');

        next();
      });

      Page.observe('access', function(ctx, next) {
        accessOptions = ctx.options;
        next();
      });
    });

    beforeEach(function resetAccessOptions() {
      accessOptions = 'access hook not triggered';
    });

    before(function createBook(done) {
      var test = this;
      app.models.Book.create({name: 'Book 1'},
        function(err, book) {
          if (err) return done(err);

          test.book = book;
          book.pages.create({name: 'Page 1'},
            function(err, page) {
              if (err) return done(err);

              test.page = page;
              page.notes.create({text: 'Page Note 1'},
                function(err, note) {
                  test.note = note;

                  done();
                });
            });
        });
    });

    before(function createChapters(done) {
      var test = this;
      test.book.chapters.create({name: 'Chapter 1'},
        function(err, chapter) {
          if (err) return done(err);

          test.chapter = chapter;
          chapter.notes.create({text: 'Chapter Note 1'}, function(err, note) {
            test.cnote = note;

            done();
          });
        });
    });

    before(function createCover(done) {
      var test = this;
      app.models.Image.create({name: 'Cover 1', book: test.book},
        function(err, image) {
          if (err) return done(err);

          test.image = image;

          done();
        });
    });

    it('has regular relationship routes - pages', function(done) {
      var test = this;
      this.get('/api/books/' + test.book.id + '/pages')
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(1);
          expect(res.body[0].name).to.equal('Page 1');

          done();
        });
    });

    it('has regular relationship routes - notes', function(done) {
      var test = this;
      this.get('/api/pages/' + test.page.id + '/notes/' + test.note.id)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.headers['x-before']).to.equal('before');
          expect(res.headers['x-after']).to.equal('after');
          expect(res.body).to.be.an('object');
          expect(res.body.text).to.equal('Page Note 1');

          done();
        });
    });

    it('has a basic error handler', function(done) {
      var test = this;
      this.get('/api/books/unknown/pages/' + test.page.id + '/notes')
        .expect(404, function(err, res) {
          if (err) return done(err);

          expect(res.body.error).to.be.an('object');
          var expected = 'could not find a model with id unknown';
          expect(res.body.error.message).to.equal(expected);
          expect(res.body.error.code).to.be.equal('MODEL_NOT_FOUND');

          done();
        });
    });

    it('enables nested relationship routes - belongsTo find', function(done) {
      var test = this;
      this.get('/api/images/' + test.image.id + '/book/pages')
        .end(function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(1);
          expect(res.body[0].name).to.equal('Page 1');

          done();
        });
    });

    it('enables nested relationship routes - belongsTo findById', function(done) {
      var test = this;
      this.get('/api/images/' + test.image.id + '/book/pages/' + test.page.id)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.an('object');
          expect(res.body.name).to.equal('Page 1');

          done();
        });
    });

    it('enables nested relationship routes - hasMany find', function(done) {
      var test = this;
      this.get('/api/books/' + test.book.id + '/pages/' + test.page.id + '/notes')
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(1);
          expect(res.body[0].text).to.equal('Page Note 1');

          done();
        });
    });

    it('enables nested relationship routes - hasMany findById', function(done) {
      var test = this;
      this.get('/api/books/' + test.book.id + '/pages/' + test.page.id + '/notes/' + test.note.id)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.headers['x-before']).to.equal('before');
          expect(res.headers['x-after']).to.equal('after');
          expect(res.body).to.be.an('object');
          expect(res.body.text).to.equal('Page Note 1');

          done();
        });
    });

    it('passes options to nested relationship routes', function() {
      return this.get(`/api/books/${this.book.id}/pages/${this.page.id}/notes/${this.note.id}`)
        .expect(200)
        .then(res => {
          expect(accessOptions).to.have.property('accessToken');
        });
    });

    it('should nest remote hooks of ModelTo - hasMany findById', function(done) {
      var test = this;
      this.get('/api/books/' + test.book.id + '/chapters/' + test.chapter.id + '/notes/' + test.cnote.id)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.headers['x-before']).to.empty();
          expect(res.headers['x-after']).to.empty();

          done();
        });
    });

    it('should have proper http.path for remoting', function() {
      [app.models.Book, app.models.Image].forEach(function(Model) {
        Model.sharedClass.methods().forEach(function(method) {
          var http = Array.isArray(method.http) ? method.http : [method.http];
          http.forEach(function(opt) {
            // destroyAll has been shared but missing http property
            if (opt.path === undefined) return;

            expect(opt.path, method.stringName).to.match(/^\/.*/);
          });
        });
      });
    });

    it('should catch error if nested function throws', function(done) {
      var test = this;
      this.get('/api/books/' + test.book.id + '/pages/' + this.page.id + '/throws')
        .end(function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.an('object');
          expect(res.body.error).to.be.an('object');
          expect(res.body.error.name).to.equal('Error');
          expect(res.body.error.statusCode).to.equal(500);
          expect(res.body.error.message).to.equal('This should not crash the app');

          done();
        });
    });
  });

  describe('hasOne', function() {
    var cust;

    before(function createCustomer(done) {
      var test = this;
      app.models.customer.create({name: 'John'}, function(err, c) {
        if (err) return done(err);

        cust = c;

        done();
      });
    });

    after(function(done) {
      var self = this;
      this.app.models.customer.destroyAll(function(err) {
        if (err) return done(err);

        self.app.models.profile.destroyAll(done);
      });
    });

    it('should create the referenced model', function(done) {
      var url = '/api/customers/' + cust.id + '/profile';

      this.post(url)
        .send({points: 10})
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.points).to.be.eql(10);
          expect(res.body.customerId).to.be.eql(cust.id);

          done();
        });
    });

    it('should find the referenced model', function(done) {
      var url = '/api/customers/' + cust.id + '/profile';
      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.points).to.be.eql(10);
          expect(res.body.customerId).to.be.eql(cust.id);

          done();
        });
    });

    it('should not create the referenced model twice', function(done) {
      var url = '/api/customers/' + cust.id + '/profile';
      this.post(url)
        .send({points: 20})
        .expect(500, function(err, res) {
          done(err);
        });
    });

    it('should update the referenced model', function(done) {
      var url = '/api/customers/' + cust.id + '/profile';
      this.put(url)
        .send({points: 100})
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.points).to.be.eql(100);
          expect(res.body.customerId).to.be.eql(cust.id);

          done();
        });
    });

    it('should delete the referenced model', function(done) {
      var url = '/api/customers/' + cust.id + '/profile';
      this.del(url)
        .expect(204, function(err, res) {
          done(err);
        });
    });

    it('should not find the referenced model', function(done) {
      var url = '/api/customers/' + cust.id + '/profile';
      this.get(url)
        .expect(404, function(err, res) {
          done(err);
        });
    });
  });
});
