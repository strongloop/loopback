var boot = require('loopback-boot');
var loopback = require('../../../../../index');

var app = module.exports = loopback();
boot(app, __dirname);
app.use(loopback.rest());
