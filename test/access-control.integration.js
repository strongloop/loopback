// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const loopback = require('../');
const lt = require('./helpers/loopback-testing-helper');
const path = require('path');
const ACCESS_CONTROL_APP = path.join(__dirname, 'fixtures', 'access-control');
const app = require(path.join(ACCESS_CONTROL_APP, 'server/server.js'));
const assert = require('assert');
const USER = {email: 'test@test.test', password: 'test'};
const CURRENT_USER = {email: 'current@test.test', password: 'test'};
const debug = require('debug')('loopback:test:access-control.integration');

describe('access control - integration', function() {
  lt.beforeEach.withApp(app);

  /*
  describe('accessToken', function() {
    // it('should be a sublcass of AccessToken', function() {
    //   assert(app.models.accessToken.prototype instanceof loopback.AccessToken);
    // });

    it('should have a validate method', function() {
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
  */

  describe('/users', function() {
    lt.beforeEach.givenModel('user', USER, 'randomUser');

    lt.it.shouldBeDeniedWhenCalledAnonymously('GET', '/api/users');
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('GET', '/api/users');
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'GET', '/api/users');

    lt.it.shouldBeDeniedWhenCalledAnonymously('GET', urlForUser);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('GET', urlForUser);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'GET', urlForUser);

    lt.it.shouldBeAllowedWhenCalledAnonymously(
      'POST', '/api/users', newUserData(),
    );

    lt.it.shouldBeAllowedWhenCalledByUser(
      CURRENT_USER, 'POST', '/api/users', newUserData(),
    );

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
        it('should not include a password', function() {
          debug('GET /api/users/:id response: %s\nheaders: %j\nbody string: %s',
            this.res.statusCode,
            this.res.headers,
            this.res.text);
          const user = this.res.body;
          assert.equal(user.password, undefined);
        });
      });

      // user has replaceOnPUT = false; so then both PUT and PATCH should be allowed for update
      lt.describe.whenCalledRemotely('PUT', '/api/users/:id', function() {
        lt.it.shouldBeAllowed();
      });

      lt.describe.whenCalledRemotely('PATCH', '/api/users/:id', function() {
        lt.it.shouldBeAllowed();
      });
    });

    lt.it.shouldBeDeniedWhenCalledAnonymously('POST', '/api/users/upsertWithWhere');
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('POST', '/api/users/upsertWithWhere');
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'POST', '/api/users/upsertWithWhere');

    lt.it.shouldBeDeniedWhenCalledAnonymously('DELETE', urlForUser);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('DELETE', urlForUser);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'DELETE', urlForUser);

    function urlForUser() {
      return '/api/users/' + this.randomUser.id;
    }

    var userCounter; // eslint-disable-line no-var
    function newUserData() {
      userCounter = userCounter ? ++userCounter : 1;

      return {
        email: 'new-' + userCounter + '@test.test',
        password: 'test',
      };
    }
  });

  describe('/banks', function() {
    const SPECIAL_USER = {email: 'special@test.test', password: 'test'};

    // define dynamic role that would only grant access when the authenticated user's email is equal to
    // SPECIAL_USER's email

    before(function() {
      const roleModel = app.registry.getModel('Role');
      const userModel = app.registry.getModel('user');

      roleModel.registerResolver('$dynamic-role', function(role, context, callback) {
        if (!(context && context.accessToken && context.accessToken.userId)) {
          return process.nextTick(function() {
            if (callback) callback(null, false);
          });
        }
        const accessToken = context.accessToken;
        userModel.findById(accessToken.userId, function(err, user) {
          if (err) {
            return callback(err, false);
          }
          if (user && user.email === SPECIAL_USER.email) {
            return callback(null, true);
          }
          return callback(null, false);
        });
      });
    });

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
    lt.it.shouldBeAllowedWhenCalledByUser(SPECIAL_USER, 'DELETE', urlForBank);

    lt.it.shouldBeDeniedWhenCalledAnonymously('POST', '/api/banks/upsertWithWhere');
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('POST', '/api/banks/upsertWithWhere');
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'POST', '/api/banks/upsertWithWhere');

    function urlForBank() {
      return '/api/banks/' + this.bank.id;
    }
  });

  describe('/accounts with replaceOnPUT true', function() {
    let count = 0;
    before(function() {
      const roleModel = loopback.getModelByType(loopback.Role);
      roleModel.registerResolver('$dummy', function(role, context, callback) {
        process.nextTick(function() {
          if (context.remotingContext) {
            count++;
          }
          if (callback) callback(null, false); // Always true
        });
      });
    });

    lt.beforeEach.givenModel('accountWithReplaceOnPUTtrue');

    lt.it.shouldBeDeniedWhenCalledAnonymously('GET', '/api/accounts-replacing');
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('GET', '/api/accounts-replacing');
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'GET', '/api/accounts-replacing');

    lt.it.shouldBeDeniedWhenCalledAnonymously('GET', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('GET', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'GET', urlForAccount);

    lt.it.shouldBeDeniedWhenCalledAnonymously('POST', '/api/accounts-replacing');
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('POST', '/api/accounts-replacing');
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'POST', '/api/accounts-replacing');

    lt.it.shouldBeDeniedWhenCalledAnonymously('POST', urlForReplaceAccountPOST);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('POST', urlForReplaceAccountPOST);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'POST', urlForReplaceAccountPOST);

    lt.it.shouldBeDeniedWhenCalledAnonymously('PUT', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('PUT', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'PUT', urlForAccount);

    lt.it.shouldBeDeniedWhenCalledAnonymously('PATCH', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('PATCH', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'PATCH', urlForAccount);

    lt.describe.whenLoggedInAsUser(CURRENT_USER, function() {
      let actId;
      beforeEach(function(done) {
        const self = this;
        // Create an account under the given user
        app.models.accountWithReplaceOnPUTtrue.create({
          userId: self.user.id,
          balance: 100,
        }, function(err, act) {
          actId = act.id;
          self.url = '/api/accounts-replacing/' + actId;
          done();
        });
      });

      lt.describe.whenCalledRemotely('PATCH', '/api/accounts-replacing/:id', function() {
        lt.it.shouldBeAllowed();
      });
      lt.describe.whenCalledRemotely('PUT', '/api/accounts-replacing/:id', function() {
        lt.it.shouldBeAllowed();
      });
      lt.describe.whenCalledRemotely('GET', '/api/accounts-replacing/:id', function() {
        lt.it.shouldBeAllowed();
      });
      lt.describe.whenCalledRemotely('DELETE', '/api/accounts-replacing/:id', function() {
        lt.it.shouldBeDenied();
      });
      describe('replace on POST verb', function() {
        beforeEach(function(done) {
          this.url = '/api/accounts-replacing/' + actId + '/replace';
          done();
        });
        lt.describe.whenCalledRemotely('POST', '/api/accounts-replacing/:id/replace', function() {
          lt.it.shouldBeAllowed();
        });
      });
    });

    lt.it.shouldBeDeniedWhenCalledAnonymously('DELETE', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('DELETE', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'DELETE', urlForAccount);

    function urlForAccount() {
      return '/api/accounts-replacing/' + this.accountWithReplaceOnPUTtrue.id;
    }
    function urlForReplaceAccountPOST() {
      return '/api/accounts-replacing/' + this.accountWithReplaceOnPUTtrue.id + '/replace';
    }
  });

  describe('/accounts with replaceOnPUT false', function() {
    lt.beforeEach.givenModel('accountWithReplaceOnPUTfalse');
    lt.it.shouldBeDeniedWhenCalledAnonymously('POST', urlForReplaceAccountPOST);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('POST', urlForReplaceAccountPOST);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'POST', urlForReplaceAccountPOST);

    lt.it.shouldBeDeniedWhenCalledAnonymously('PUT', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('PUT', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'PUT', urlForAccount);

    lt.it.shouldBeDeniedWhenCalledAnonymously('PATCH', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('PATCH', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'PATCH', urlForAccount);

    lt.describe.whenLoggedInAsUser(CURRENT_USER, function() {
      let actId;
      beforeEach(function(done) {
        const self = this;
        // Create an account under the given user
        app.models.accountWithReplaceOnPUTfalse.create({
          userId: self.user.id,
          balance: 100,
        }, function(err, act) {
          actId = act.id;
          self.url = '/api/accounts-updating/' + actId;
          done();
        });
      });

      lt.describe.whenCalledRemotely('PATCH', '/api/accounts-updating/:id', function() {
        lt.it.shouldBeAllowed();
      });

      lt.describe.whenCalledRemotely('PUT', '/api/accounts-updating/:id', function() {
        lt.it.shouldBeAllowed();
      });
      lt.describe.whenCalledRemotely('GET', '/api/accounts-updating/:id', function() {
        lt.it.shouldBeAllowed();
      });
      lt.describe.whenCalledRemotely('DELETE', '/api/accounts-updating/:id', function() {
        lt.it.shouldBeDenied();
      });

      describe('replace on POST verb', function() {
        beforeEach(function(done) {
          this.url = '/api/accounts-updating/' + actId + '/replace';
          done();
        });
        lt.describe.whenCalledRemotely('POST', '/api/accounts-updating/:id/replace', function() {
          lt.it.shouldBeAllowed();
        });
      });
    });

    lt.it.shouldBeDeniedWhenCalledAnonymously('DELETE', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledUnauthenticated('DELETE', urlForAccount);
    lt.it.shouldBeDeniedWhenCalledByUser(CURRENT_USER, 'DELETE', urlForAccount);

    function urlForAccount() {
      return '/api/accounts-updating/' + this.accountWithReplaceOnPUTfalse.id;
    }
    function urlForReplaceAccountPOST() {
      return '/api/accounts-updating/' + this.accountWithReplaceOnPUTfalse.id + '/replace';
    }
  });
});
