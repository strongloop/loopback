/*jshint -W030 */
var loopback = require('../');
var lt = require('loopback-testing');
var path = require('path');
var SIMPLE_APP = path.join(__dirname, 'fixtures', 'user-integration-app');
var app = require(path.join(SIMPLE_APP, 'server/server.js'));
var expect = require('chai').expect;

describe('users - integration', function() {

  lt.beforeEach.withApp(app);

  before(function(done) {
    // HACK: [rfeng] We have to reset the relations as they are polluted by
    // other tests
    app.models.User.hasMany(app.models.post);
    app.models.User.hasMany(app.models.AccessToken,
      {options: {disableInclude: true}});
    app.models.AccessToken.belongsTo(app.models.User);
    app.models.User.destroyAll(function(err) {
      if (err) return done(err);
      app.models.post.destroyAll(function(err) {
        if (err) return done(err);
        app.models.blog.destroyAll(function(err) {
          if (err) return done(err);
          done();
        });
      });
    });
  });

  describe('base-user', function() {
    var userId;
    var accessToken;

    it('should create a new user', function(done) {
      this.post('/api/users')
        .send({username: 'x', email: 'x@y.com', password: 'x'})
        .expect(200, function(err, res) {
          if (err) return done(err);
          expect(res.body.id).to.exist;
          userId = res.body.id;
          done();
        });
    });

    it('should log into the user', function(done) {
      var url = '/api/users/login';

      this.post(url)
        .send({username: 'x', email: 'x@y.com', password: 'x'})
        .expect(200, function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.body.id).to.exist;
          accessToken = res.body.id;
          done();
        });
    });

    it('should create post for a given user', function(done) {
      var url = '/api/users/' + userId + '/posts?access_token=' + accessToken;
      this.post(url)
        .send({title: 'T1', content: 'C1'})
        .expect(200, function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.body.title).to.be.eql('T1');
          expect(res.body.content).to.be.eql('C1');
          expect(res.body.userId).to.be.eql(userId);
          done();
        });
    });

    // FIXME: [rfeng] The test is passing if run alone. But it fails with
    // `npm test` as the loopback models are polluted by other tests
    it('should prevent access tokens from being included', function(done) {
      var url = '/api/posts?filter={"include":{"user":"accessTokens"}}';
      this.get(url)
        .expect(200, function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.body).to.have.property('length', 1);
          var post = res.body[0];
          expect(post.user).to.have.property('username', 'x');
          expect(post.user).to.not.have.property('accessTokens');
          done();
        });
    });
  });

  describe('sub-user', function() {
    var userId;
    var accessToken;

    it('should create a new user', function(done) {
      var url = '/api/myUsers';

      this.post(url)
        .send({username: 'x', email: 'x@y.com', password: 'x'})
        .expect(200, function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.body.id).to.exist;
          userId = res.body.id;
          done();
        });
    });

    it('should log into the user', function(done) {
      var url = '/api/myUsers/login';

      this.post(url)
        .send({username: 'x', email: 'x@y.com', password: 'x'})
        .expect(200, function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.body.id).to.exist;
          accessToken = res.body.id;
          done();
        });
    });

    it('should create blog for a given user', function(done) {
      var url = '/api/myUsers/' + userId + '/blogs?access_token=' + accessToken;
      this.post(url)
        .send({title: 'T1', content: 'C1'})
        .expect(200, function(err, res) {
          if (err) {
            console.error(err);
            return done(err);
          }
          expect(res.body.title).to.be.eql('T1');
          expect(res.body.content).to.be.eql('C1');
          expect(res.body.userId).to.be.eql(userId);
          done();
        });
    });

    it('should prevent access tokens from being included', function(done) {
      var url = '/api/blogs?filter={"include":{"user":"accessTokens"}}';
      this.get(url)
        .expect(200, function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.body).to.have.property('length', 1);
          var blog = res.body[0];
          expect(blog.user).to.have.property('username', 'x');
          expect(blog.user).to.not.have.property('accessTokens');
          done();
        });
    });
  });

});

