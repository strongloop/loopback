'use strict';

var loopback = require('../../../../');
var boot = require('loopback-boot');
var app = module.exports = loopback();

boot(app, __dirname, function(err) {
  if (err) {
    console.log(err);
    throw err;
  }
  app.emit('booted');
});
