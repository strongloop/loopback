var loopback = require('../../../');
var path = require('path');
var app = module.exports = loopback();
var models = require('./models');
var TestModel = models.TestModel;
// var explorer = require('loopback-explorer');

app.use(loopback.cookieParser({secret: app.get('cookieSecret')}));
var apiPath = '/api';
app.use(apiPath, loopback.rest());

TestModel.attachTo(loopback.memory());
app.model(TestModel);
app.model(TestModel.getChangeModel());

// app.use('/explorer', explorer(app, {basePath: apiPath}));

app.use(loopback.static(path.join(__dirname, 'public')));
app.use(loopback.urlNotFound());
app.use(loopback.errorHandler());
