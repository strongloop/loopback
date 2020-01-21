// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const expect = require('./helpers/expect');
const http = require('http');
const loopback = require('..');
const supertest = require('supertest');

const AN_OBJECT_VALUE = {name: 'an-object'};

describe('KeyValueModel', function() {
  let request, app, CacheItem;
  beforeEach(setupAppAndCacheItem);

  describe('REST API', function() {
    before(setupSharedHttpServer);

    it('provides "get(key)" at "GET /key"', function(done) {
      CacheItem.set('get-key', AN_OBJECT_VALUE);
      request.get('/CacheItems/get-key')
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.eql(AN_OBJECT_VALUE);
          done();
        });
    });

    it('returns 404 when getting a key that does not exist', function(done) {
      request.get('/CacheItems/key-does-not-exist')
        .expect(404, done);
    });

    it('provides "set(key)" at "PUT /key"', function(done) {
      request.put('/CacheItems/set-key')
        .send(AN_OBJECT_VALUE)
        .expect(204)
        .end(function(err, res) {
          if (err) return done(err);
          CacheItem.get('set-key', function(err, value) {
            if (err) return done(err);
            expect(value).to.eql(AN_OBJECT_VALUE);
            done();
          });
        });
    });

    it('provides "set(key, ttl)" at "PUT /key?ttl={num}"', function(done) {
      request.put('/CacheItems/set-key-ttl?ttl=10')
        .send(AN_OBJECT_VALUE)
        .end(function(err, res) {
          if (err) return done(err);
          setTimeout(function() {
            CacheItem.get('set-key-ttl', function(err, value) {
              if (err) return done(err);
              expect(value).to.equal(null);
              done();
            });
          }, 20);
        });
    });

    it('provides "expire(key, ttl)" at "PUT /key/expire"',
      function(done) {
        CacheItem.set('expire-key', AN_OBJECT_VALUE, function(err) {
          if (err) return done(err);
          request.put('/CacheItems/expire-key/expire')
            .send({ttl: 10})
            .end(function(err, res) {
              if (err) return done(err);
              setTimeout(function() {
                CacheItem.get('set-key-ttl', function(err, value) {
                  if (err) return done(err);
                  expect(value).to.equal(null);
                  done();
                });
              }, 20);
            });
        });
      });

    it('returns 404 when expiring a key that does not exist', function(done) {
      request.put('/CacheItems/key-does-not-exist/expire')
        .send({ttl: 10})
        .expect(404, done);
    });

    it('provides "ttl(key)" at "GET /key/ttl"', function(done) {
      request.put('/CacheItems/ttl-key?ttl=2000')
        .end(function(err, res) {
          if (err) return done(err);
          request.get('/CacheItems/ttl-key/ttl')
            .end(function(err, res) {
              if (err) return done(err);
              expect(res.body).to.be.a('number');
              done();
            });
        });
    });

    it('returns 204 when getting TTL for a key that does not have TTL set',
      function(done) {
        request.put('/CacheItems/ttl-key')
          .end(function(err, res) {
            if (err) return done(err);
            request.get('/CacheItems/ttl-key/ttl')
              .expect(204, done);
          });
      });

    it('returns 404 when getting TTL for a key when TTL has expired',
      function(done) {
        request.put('/CacheItems/ttl-key?ttl=10')
          .end(function(err, res) {
            setTimeout(function() {
              if (err) return done(err);
              request.get('/CacheItems/ttl-key/ttl')
                .expect(404, done);
            }, 20);
          });
      });

    it('returns 404 when getting TTL for a key that does not exist',
      function(done) {
        request.get('/CacheItems/key-does-not-exist/ttl')
          .expect(404, done);
      });

    it('provides "keys(filter)" at "GET /keys"', function(done) {
      CacheItem.set('list-key', AN_OBJECT_VALUE, function(err) {
        if (err) return done(err);
        request.get('/CacheItems/keys')
          .send(AN_OBJECT_VALUE)
          .end(function(err, res) {
            if (err) return done(err);
            if (res.body.error) return done(res.body.error);
            expect(res.body).to.eql(['list-key']);
            done();
          });
      });
    });
  });

  function setupAppAndCacheItem() {
    app = loopback({localRegistry: true, loadBuiltinModels: true});
    app.use(loopback.rest());

    CacheItem = app.registry.createModel({
      name: 'CacheItem',
      base: 'KeyValueModel',
    });

    app.dataSource('kv', {connector: 'kv-memory'});
    app.model(CacheItem, {dataSource: 'kv'});
  }

  let _server, _requestHandler; // eslint-disable-line one-var
  function setupSharedHttpServer(done) {
    _server = http.createServer(function(req, res) {
      app(req, res);
    });
    _server.listen(0, '127.0.0.1')
      .once('listening', function() {
        request = supertest('http://127.0.0.1:' + this.address().port);
        done();
      })
      .once('error', function(err) { done(err); });
  }
});
