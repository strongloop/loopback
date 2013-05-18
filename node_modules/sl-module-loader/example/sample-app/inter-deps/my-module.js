var Module = require('../../../').Module;
var inherits = require('util').inherits;


module.exports = MyModule;

function MyModule(options) {
  Module.apply(this, arguments);
  
  console.log('the "inter-deps" module loads a dependency', this.dependencies['custom-dep']);
}

MyModule.dependencies = {
  // the dep name and path to a module that exports its supported type
  'custom-dep': '../my-module-type'
};

inherits(MyModule, Module);