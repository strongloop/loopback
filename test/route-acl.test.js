var expect = require('chai').expect;
var routeAcl = require('../server/middleware/acl');
var loopback = require('../index');

var options = {
  scopes: {
    catalog: [{
      'methods': 'GET',
      'path': '/api/catalog'
    }],
    order: [{
      methods: 'ALL',
      path: '/api/orders'
    }],
    cancelOrder: [{
      methods: 'delete',
      'path': '/api/orders/:id'
    }],
    deleteEntities: [
      {
        methods: ['delete'],
        path: '/api/:model'
      }
    ]
  },
  acls: [
    {
      role: '$everyone',
      scopes: ['catalog'],
      permission: 'ALLOW'
    },
    {
      role: '$unauthenticated',
      scopes: ['order'],
      permission: 'DENY'
    },
    {
      role: '$everyone',
      scopes: ['deleteEntities'],
      permission: 'DENY'
    },
    {
      principalType: 'ROLE',
      principalId: 'admin',
      scopes: ['deleteEntities'],
      permission: 'ALLOW'
    },
    {
      principalType: 'ROLE',
      principalId: 'cs',
      scopes: ['cancelOrder'],
      permission: 'ALLOW'
    }
  ],
  roles: {
    admin: [
      {principalType: 'USER', principalId: 'mary'}
    ],
    demo: [
      {principalType: 'USER', principalId: 'john'},
      {principalType: 'APP', principalId: 'demo-app'}]
  }
};

describe('route based ACLs', function() {
  var handler;

  before(function(done) {
    handler = routeAcl(options);
    var ds = loopback.createDataSource({
      connector: 'memory',
      name: 'db',
      defaultForType: 'db'
    });
    loopback.Application.attachTo(ds);
    loopback.User.attachTo(ds);
    loopback.Role.attachTo(ds);
    loopback.RoleMapping.attachTo(ds);

    loopback.Role.create({name: 'cs'}, function(err, role) {
      if (err) return done(err);
      loopback.RoleMapping.create(
        {roleId: role.id, principalType: 'USER', principalId: 'mike'}, done);
    });
  });

  it('should allow $everyone to get /api/catalog', function(done) {
    var req = {
      method: 'get',
      originalUrl: '/api/catalog',
      url: '/api/catalog',
      headers: {
        'Accept': 'application/json'
      },
      query: {
        filter: {
          limit: 100
        }
      }
    };
    var res = {};
    handler(req, res, done);
  });

  it('should allow $authenticated to get /api/catalog', function(done) {
    var req = {
      method: 'get',
      originalUrl: '/api/catalog',
      url: '/api/catalog',
      headers: {
        'Accept': 'application/json'
      },
      query: {
        filter: {
          limit: 100
        }
      },
      accessToken: {
        userId: 'john',
        appId: 'demo-app'
      }
    };
    var res = {};
    handler(req, res, done);
  });

  it('should deny $unauthenticated get /api/orders', function(done) {
    var req = {
      method: 'get',
      url: '/api/orders',
      headers: {
        'Accept': 'application/json'
      },
      query: {
        filter: {
          limit: 100
        }
      }
    };
    var res = {};
    handler(req, res, function(err) {
      expect(err).to.be.instanceof(Error);
      expect(err.statusCode).to.equal(403);
      done();
    });
  });

  it('should allow deletes for admin users', function(done) {
    var req = {
      method: 'delete',
      originalUrl: '/api/catalog',
      url: '/api/catalog',
      headers: {
        'Accept': 'application/json'
      },
      accessToken: {
        userId: 'mary',
        appId: 'demo-app'
      }
    };
    var res = {};
    handler(req, res, done);
  });

  it('should reject deletes for non-admin users', function(done) {
    var req = {
      method: 'delete',
      originalUrl: '/api/catalog',
      url: '/api/catalog',
      headers: {
        'Accept': 'application/json'
      },
      accessToken: {
        userId: 'john',
        appId: 'demo-app'
      }
    };
    var res = {};
    handler(req, res, function(err) {
      expect(err).to.be.instanceof(Error);
      expect(err.statusCode).to.equal(403);
      done();
    });
  });

  it('should allow cancel order for cs users', function(done) {
    var req = {
      method: 'delete',
      url: '/api/orders/100',
      headers: {
        'Accept': 'application/json'
      },
      accessToken: {
        userId: 'mike',
        appId: 'demo-app'
      }
    };
    var res = {};
    handler(req, res, done);
  });
});
