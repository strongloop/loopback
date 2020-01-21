// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const expect = require('./helpers/expect');
const loopback = require('../');
const net = require('net');

describe('loopback application', function() {
  it('pauses request stream during authentication', function(done) {
    // This test reproduces the issue reported in
    //   https://github.com/strongloop/loopback-storage-service/issues/7
    const app = loopback();
    setupAppWithStreamingMethod();

    app.listen(0, function() {
      sendHttpRequestInOnePacket(
        this.address().port,
        'POST /streamers/read HTTP/1.0\n' +
          'Content-Length: 1\n' +
          'Content-Type: application/x-custom-octet-stream\n' +
          '\n' +
          'X',
        function(err, res) {
          if (err) return done(err);

          expect(res).to.match(/\nX$/);

          done();
        },
      );
    });

    function setupAppWithStreamingMethod() {
      app.dataSource('db', {
        connector: loopback.Memory,
      });
      const db = app.datasources.db;

      loopback.User.attachTo(db);
      loopback.AccessToken.attachTo(db);
      loopback.Role.attachTo(db);
      loopback.ACL.attachTo(db);
      loopback.User.hasMany(loopback.AccessToken, {as: 'accessTokens'});

      const Streamer = app.registry.createModel('Streamer');
      app.model(Streamer, {dataSource: 'db'});
      Streamer.read = function(req, res, cb) {
        let body = new Buffer(0);
        req.on('data', function(chunk) {
          body += chunk;
        });
        req.on('end', function() {
          res.end(body.toString());
          // we must not call the callback here
          // because it will attempt to add response headers
        });
        req.once('error', function(err) {
          cb(err);
        });
      };
      loopback.remoteMethod(Streamer.read, {
        http: {method: 'post'},
        accepts: [
          {arg: 'req', type: 'Object', http: {source: 'req'}},
          {arg: 'res', type: 'Object', http: {source: 'res'}},
        ],
      });

      app.enableAuth();
      app.use(loopback.token({model: app.models.accessToken}));
      app.use(loopback.rest());
    }

    function sendHttpRequestInOnePacket(port, reqString, cb) {
      const socket = net.createConnection(port);
      let response = new Buffer(0);

      socket.on('data', function(chunk) {
        response += chunk;
      });
      socket.on('end', function() {
        callCb(null, response.toString());
      });
      socket.once('error', function(err) {
        callCb(err);
      });

      socket.write(reqString.replace(/\n/g, '\r\n'));

      function callCb(err, res) {
        if (!cb) return;
        cb(err, res);
        cb = null;
      }
    }
  });
});
