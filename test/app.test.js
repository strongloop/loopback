describe('app', function() {

  describe('app.model(Model)', function() {
    it("Expose a `Model` to remote clients.", function(done) {
      /* example - 
      var memory = asteroid.createDataSource({connector: 'memory'});
      var Color = memory.defineModel({name: String});
      app.model(Color);
      app.use(asteroid.rest());
      
      
      */
      done(new Error('test not implemented'));
    });
  });

  describe('app.models()', function() {
    it("Get the app's exposed models.", function(done) {
      /* example - 
      var models = app.models();
      
      models.forEach(function (Model) {
        console.log(Model.name); // color
      });
      
      var Color = asteroid.createModel({name: 'string'});
      var red = new Color({name: 'red'});
      var User = asteroid.createModel('user', {
        first: String,
        last: String,
        age: Number
      });
      */
      done(new Error('test not implemented'));
    });
  });
});