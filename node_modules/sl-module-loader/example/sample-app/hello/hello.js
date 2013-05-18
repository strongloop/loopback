var MyModuleType = require('../my-module-type');
var util = require('util');

module.exports = HelloModule;

function HelloModule(options) {
  MyModuleType.call(this, options);
}

util.inherits(HelloModule, MyModuleType);

HelloModule.prototype.speak = function () {
  console.log('from hello module', this.options);
}