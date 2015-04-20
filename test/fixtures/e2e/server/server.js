var loopback = require('../../../../index');
var app = module.exports = loopback();
var models = require('./models');
var TestModel = models.TestModel;

var apiPath = '/api';
app.use(apiPath, loopback.rest());

TestModel.attachTo(loopback.memory());
app.model(TestModel);
app.model(TestModel.getChangeModel());

// app.use(loopback.static(path.join(__dirname, 'public')));
app.use(loopback.urlNotFound());
app.use(loopback.errorHandler());
