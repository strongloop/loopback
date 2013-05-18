var Module = require('../lib/module.js');
var inherits = require('util').inherits;

describe('Module', function(){
  var module;
  
  beforeEach(function(){
    module = new Module;
  });
  
  it('should merge all dependency objects', function() {
    function FooModule() {
      Module.apply(this, arguments);
    }
      
    inherits(FooModule, Module);
    
    FooModule.dependencies = {
      'foo': 'foo',
      'baz': 'baz'
    }
      
    function BarModule() {
      FooModule.apply(this, arguments);
    }
    
    inherits(BarModule, FooModule);
    
    BarModule.dependencies = {
      'foo': 'complex-foo',
      'bar': 'bar'
    };
    
    var called = false;
    
    BarModule.prototype._resolveDependencies = function (depsConfig, desc) {
      assert(desc.foo == 'complex-foo');
      assert(desc.bar == 'bar');
      assert(desc.baz == 'baz');
      called = true;
    }
    
    var bar = new BarModule({}, {});
    
    assert(called);
  });
  
});