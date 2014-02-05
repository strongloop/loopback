/*!
 * Module dependencies.
 */

var loopback = require('../loopback');

/**
 * Export the middleware.
 */

module.exports = models;

/**
 * Return a script that defines all remote models.
 */

function models(app) {
  return function (req, res, next) {
    var script = 'window.loopback.remoteModels = ';
    var models = [];
    app.handler('rest').adapter.getClasses().forEach(function(c) {
      if (!c.ctor) {
        // Skip classes that don't have a shared ctor
        // as they are not LoopBack models
        console.error('Skipping %j as it is not a LoopBack model', name);
        return;
      }
      models.push(toJSON(c));
    });
    res.send(script + JSON.stringify(models, null, 2));
  }
}

function toJSON(sharedClass) {
  var model = loopback.getModel(sharedClass.name);

  var result = {
    modelName: model.modelName,
    settings: model.settings,
    properties: model.properties,
    baseRoute: sharedClass.routes[0],
    methods: sharedClass.methods
  };

  result.settings.base = model.super_.modelName;

  return result;
}
