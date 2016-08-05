// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var loopback = require('../');
var app;
var expect = require('chai').expect;
var request = require('supertest');

describe('loopback.errorHandler(options)', function() {

  it('should return default middleware when options object is not present', function(done) {

    //arrange
    var app = loopback();
    app.use(loopback.urlNotFound());
    app.use(loopback.errorHandler({ log: false }));

    //act/assert
    request(app)
      .get('/url-does-not-exist')
      .end(function(err, res) {
        expect(res.error.text).to.match(
          /<ul id="stacktrace"><li>( &nbsp;)+at raiseUrlNotFoundError/);

        done();
      });
  });

  it('should delete stack when options.includeStack is false', function(done) {

    //arrange
    var app = loopback();
    app.use(loopback.urlNotFound());
    app.use(loopback.errorHandler({ includeStack: false, log: false }));

    //act/assert
    request(app)
      .get('/url-does-not-exist')
      .end(function(err, res) {
        expect(res.error.text).to.match(/<ul id="stacktrace"><\/ul>/);

        done();
      });
  });

  it('should pass options on to error handler module', function(done) {
    //arrange
    var app = loopback();
    app.use(loopback.urlNotFound());

    var errorLogged;
    app.use(loopback.errorHandler({
      includeStack: false,
      log: function customLogger(err, str, req) {
        errorLogged = err;
      }
    }));

    //act
    request(app).get('/url-does-not-exist').end(function(err) {
      if (err) return done(err);
      //assert
      expect(errorLogged)
        .to.have.property('message', 'Cannot GET /url-does-not-exist');

      done();
    });

  });
});
