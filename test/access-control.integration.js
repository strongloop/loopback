var loopback = require('loopback');
var path = require('path');
process.env.PATH_TO_LOOPACK = path.join(__dirname, '..');
var lt = require('loopback-testing');
var ACCESS_CONTROL_APP = path.join(__dirname, 'fixtures', 'access-control');
var app = require(path.join(ACCESS_CONTROL_APP, 'app.js'));
var assert = require('assert');
var USER = {email: 'test@test.test', password: 'test'};
var CURRENT_USER = {email: 'current@test.test', password: 'test'};

describe('access control - integration', function () {

  lt.beforeEach.withApp(app);

  describe('accessToken', function() {
    it('should be a sublcass of AccessToken', function () {
      assert(app.models.accessToken.prototype instanceof loopback.AccessToken);
    });

    it('should have a validate method', function () {
      var token = new app.models.accessToken;
      assert.equal(typeof token.validate, 'function');  
    });
  });

  describe('/accessToken', function() {

    lt.beforeEach.givenModel('accessToken', {}, 'randomToken');

    lt.it.shouldBeAllowedWhenCalledAnonymously('POST', '/api/accessTokens');
    lt.it.shouldBeAllowedWhenCalledUnauthenticated('POST', '/api/accessTokens');
    lt.it.shouldBeAllowedWhenCalledByUser(USER, 'POST', '/api/accessTokens');

    lt.it.shouldBeDeniedWhenCalledAnonymously('GET', '/api/accessTokens');
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('GET', '/api/accessTokens');
    lt.it.shouldBeDeniedWhenCalledByUser(USER, 'GET', '/api/accessTokens');

    lt.it.shouldBeDeniedWhenCalledAnonymously('PUT', '/api/accessTokens');
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('PUT', '/api/accessTokens');
    lt.it.shouldBeDeniedWhenCalledByUser(USER, 'PUT', '/api/accessTokens');

    lt.it.shouldBeDeniedWhenCalledAnonymously('GET', urlForToken);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('GET', urlForToken);
    lt.it.shouldBeDeniedWhenCalledByUser(USER, 'GET', urlForToken);

    lt.it.shouldBeDeniedWhenCalledAnonymously('PUT', urlForToken);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('PUT', urlForToken);
    lt.it.shouldBeDeniedWhenCalledByUser(USER, 'PUT', urlForToken);

    lt.it.shouldBeDeniedWhenCalledAnonymously('DELETE', urlForToken);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('DELETE', urlForToken);
    lt.it.shouldBeDeniedWhenCalledByUser(USER, 'DELETE', urlForToken);

    function urlForToken() {
      return '/api/accessTokens/' + this.randomToken.id;
    }
  });

  describe('/users', function () {

    lt.beforeEach.givenModel('user', USER, 'randomUser');

    lt.it.shouldBeDeniedWhenCalledAnonymously('GET', '/api/users');
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('GET', '/api/users');
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'GET', '/api/users');
    
    lt.it.shouldBeDeniedWhenCalledAnonymously('GET', urlForUser);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('GET', urlForUser);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER,'GET', urlForUser);

    lt.it.shouldBeAllowedWhenCalledAnonymously('POST', '/api/users');
    lt.it.shouldBeAllowedWhenCalledByUser(CURRENT_USER, 'POST', '/api/users');

    lt.it.shouldBeAllowedWhenCalledByUser(CURRENT_USER, 'POST', '/api/users/logout');

    lt.describe.whenCalledRemotely('DELETE', '/api/users', function() {
      lt.it.shouldNotBeFound();
    });

    lt.it.shouldBeDeniedWhenCalledAnonymously('PUT', urlForUser);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('PUT', urlForUser);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'PUT', urlForUser);

    lt.it.shouldBeDeniedWhenCalledAnonymously('PUT', urlForUser);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('PUT', urlForUser);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'PUT', urlForUser);

    lt.describe.whenLoggedInAsUser(CURRENT_USER, function() {
      beforeEach(function() {
        this.url = '/api/users/' + this.user.id + '?ok';
      });
      lt.describe.whenCalledRemotely('DELETE', '/api/users/:id', function() {
        lt.it.shouldBeAllowed();
      });
      lt.describe.whenCalledRemotely('GET', '/api/users/:id', function() {
        lt.it.shouldBeAllowed();
      });
      lt.describe.whenCalledRemotely('PUT', '/api/users/:id', function() {
        lt.it.shouldBeAllowed();
      });
    });

    lt.it.shouldBeDeniedWhenCalledAnonymously('DELETE', urlForUser);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('DELETE', urlForUser);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'DELETE', urlForUser);

    function urlForUser() {
      return '/api/users/' + this.randomUser.id;
    }
  });

  describe('/banks', function () {
    lt.beforeEach.givenModel('bank');

    lt.it.shouldBeAllowedWhenCalledAnonymously('GET', '/api/banks');
    lt.it.shouldBeAllowedWhenCalledUnauthenticated('GET', '/api/banks');
    lt.it.shouldBeAllowedWhenCalledByUser(CURRENT_USER, 'GET', '/api/banks');

    lt.it.shouldBeAllowedWhenCalledAnonymously('GET', urlForBank);
    lt.it.shouldBeAllowedWhenCalledUnauthenticated('GET', urlForBank);
    lt.it.shouldBeAllowedWhenCalledByUser(CURRENT_USER, 'GET', urlForBank);

    lt.it.shouldBeDeniedWhenCalledAnonymously('POST', '/api/banks');
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('POST', '/api/banks');
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'POST', '/api/banks');

    lt.it.shouldBeDeniedWhenCalledAnonymously('PUT', urlForBank);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('PUT', urlForBank);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'PUT', urlForBank);

    lt.it.shouldBeDeniedWhenCalledAnonymously('DELETE', urlForBank);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('DELETE', urlForBank);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'DELETE', urlForBank);

    function urlForBank() {
      return '/api/banks/' + this.bank.id;
    }
  });

  describe('/accounts', function () {
    lt.beforeEach.givenModel('account');

    lt.it.shouldBeDeniedWhenCalledAnonymously('GET', '/api/accounts');
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('GET', '/api/accounts');
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'GET', '/api/accounts');

    lt.it.shouldBeDeniedWhenCalledAnonymously('GET', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('GET', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'GET', urlForAccount);

    lt.it.shouldBeDeniedWhenCalledAnonymously('POST', '/api/accounts');
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('POST', '/api/accounts');
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'POST', '/api/accounts');

    lt.it.shouldBeDeniedWhenCalledAnonymously('PUT', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('PUT', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'PUT', urlForAccount);

    lt.describe.whenLoggedInAsUser(CURRENT_USER, function() {
      beforeEach(function() {
        this.url = '/api/accounts/' + this.user.accountId;
      });
      lt.describe.whenCalledRemotely('PUT', '/api/accounts/:id', function() {
        lt.it.shouldBeAllowed();
      });
      lt.describe.whenCalledRemotely('DELETE', '/api/accounts/:id', function() {
        lt.it.shouldBeDenied();
      });
    });

    lt.it.shouldBeDeniedWhenCalledAnonymously('DELETE', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('DELETE', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'DELETE', urlForAccount);

    function urlForAccount() {
      return '/api/accounts/' + this.account.id;
    }
  });
  
});
