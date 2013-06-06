var asteroid = require('../');

describe('app', function(){
  var app;
  
  beforeEach(function () {
    app = asteroid();
  });
  
  describe('.model(Model)', function(){
    it('should expose a Model to remote clients', function() {
      var memory = asteroid.createDataSource({adapter: 'memory'});
      var Color = memory.defineModel({name: String});

      app.model(Color);
      assert(app.models()[0] === MyModel, 'should add MyModel to the app models');
    });
  });
});