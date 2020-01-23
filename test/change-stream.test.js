// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const expect = require('./helpers/expect');
const sinon = require('sinon');
const loopback = require('../');

describe('PersistedModel.createChangeStream()', function() {
  describe('configured to source changes locally', function() {
    before(function() {
      const test = this;
      const app = loopback({localRegistry: true});
      const ds = app.dataSource('ds', {connector: 'memory'});
      const Score = app.registry.createModel('Score');
      this.Score = app.model(Score, {
        dataSource: 'ds',
        changeDataSource: false, // use only local observers
      });
    });

    afterEach(verifyObserversRemoval);

    it('should detect create', function(done) {
      const Score = this.Score;

      Score.createChangeStream(function(err, changes) {
        changes.on('data', function(change) {
          expect(change.type).to.equal('create');
          changes.destroy();
          done();
        });

        Score.create({team: 'foo'});
      });
    });

    it('should detect update', function(done) {
      const Score = this.Score;
      Score.create({team: 'foo'}, function(err, newScore) {
        Score.createChangeStream(function(err, changes) {
          changes.on('data', function(change) {
            expect(change.type).to.equal('update');
            changes.destroy();

            done();
          });
          newScore.updateAttributes({
            bat: 'baz',
          });
        });
      });
    });

    it('should detect delete', function(done) {
      const Score = this.Score;
      Score.create({team: 'foo'}, function(err, newScore) {
        Score.createChangeStream(function(err, changes) {
          changes.on('data', function(change) {
            expect(change.type).to.equal('remove');
            changes.destroy();

            done();
          });

          newScore.remove();
        });
      });
    });

    it('should apply "where" and "fields" to create events', function() {
      const Score = this.Score;
      const data = [
        {team: 'baz', player: 'baz', value: 1},
        {team: 'bar', player: 'baz', value: 2},
        {team: 'foo', player: 'bar', value: 3},
      ];
      const options = {where: {player: 'bar'}, fields: ['team', 'value']};
      const changes = [];
      let changeStream;

      return Score.createChangeStream(options)
        .then(stream => {
          changeStream = stream;
          changeStream.on('data', function(change) {
            changes.push(change);
          });

          return Score.create(data);
        })
        .then(scores => {
          changeStream.destroy();

          expect(changes).to.have.length(1);
          expect(changes[0]).to.have.property('type', 'create');
          expect(changes[0].data).to.eql({
            'team': 'foo',
            value: 3,
          });
        });
    });

    it('should not emit changes after destroy', function(done) {
      const Score = this.Score;

      const spy = sinon.spy();

      Score.createChangeStream(function(err, changes) {
        changes.on('data', function() {
          spy();
          changes.destroy();
        });

        Score.create({team: 'foo'})
          .then(() => Score.deleteAll())
          .then(() => {
            expect(spy.calledOnce);
            done();
          });
      });
    });

    function verifyObserversRemoval() {
      const Score = this.Score;
      expect(Score._observers['after save']).to.be.empty();
      expect(Score._observers['after delete']).to.be.empty();
    }
  });

  // TODO(ritch) implement multi-server support
  describe.skip('configured to source changes using pubsub', function() {
    before(function() {
      const test = this;
      const app = loopback({localRegistry: true});
      const db = app.dataSource('ds', {connector: 'memory'});
      const ps = app.dataSource('ps', {
        host: 'localhost',
        port: '12345',
        connector: 'pubsub',
        pubsubAdapter: 'mqtt',
      });
      this.Score = app.model('Score', {
        dataSource: 'db',
        changeDataSource: 'ps',
      });
    });

    it('should detect a change', function(done) {
      const Score = this.Score;

      Score.createChangeStream(function(err, changes) {
        changes.on('data', function(change) {
          done();
        });
      });
    });
  });
});
