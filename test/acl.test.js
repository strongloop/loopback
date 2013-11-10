var assert = require('assert');
var loopback = require('../index');
var acl = require('../lib/models/acl');
var User = loopback.User;

describe('security scopes', function () {

  it("should allow access to models", function () {
    var ds = loopback.createDataSource({connector: loopback.Memory});
    acl.Scope.attachTo(ds);
    acl.ScopeResourceAccess.attachTo(ds);

    // console.log(acl.Scope.relations);

    acl.Scope.create({name: 'user', description: 'access user information'}, function (err, scope) {
      console.log(scope);
      scope.resources.create({model: 'user', property: '*', accessType: '*', permission: 'Allow'}, function (err, resource) {
        console.log(resource);
        acl.Scope.isAllowed('user', 'user', '*', '*', console.log);
      });
    });

  });

});



