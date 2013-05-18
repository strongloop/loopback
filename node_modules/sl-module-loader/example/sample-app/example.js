var ModuleLoader = require('../../');
var moduleLoader = ModuleLoader.create('.');

moduleLoader.load(function (err, modules) {
  if(err) throw err;
  
  console.log('loaded modules...');
  
  moduleLoader.instanceOf('MyModuleType').forEach(function (m) {
    m.speak();
  });
});