'use strict';
var assert = require('assert');

describe('object-storage connector', function() {
  it('should be set up as loopback-component-storage', function(done) {
    this.timeout(10000);
    var app = require('./fixtures/object-storage-app');
    var booted = false;
    app.on('booted', function() {
      if (booted) return;
      assert('MyObjectStorage' in app.datasources);
      var ds = app.datasources.MyObjectStorage;
      assert.equal(ds.name, 'loopback-component-storage');
      assert.equal(ds.settings.connector, 'loopback-component-storage');
      assert.equal(ds.settings.provider, 'openstack');
      assert.equal(ds.settings.useServiceCatalog, true);
      assert.equal(ds.settings.useInternal, false);
      assert.equal(ds.settings.keystoneAuthVersion, 'v3');
      booted = true;
      done();
    });
  });
});
