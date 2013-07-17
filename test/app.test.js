describe('app', function() {

  describe('app.model(Model)', function() {
    it("Expose a `Model` to remote clients", function() {
      var memory = loopback.createDataSource({connector: loopback.Memory});
      var Color = memory.createModel('color', {name: String});
      app.model(Color);
      assert.equal(app.models().length, 1);
    });
  });

  describe('app.models()', function() {
    it("Get the app's exposed models", function() {
      var Color = loopback.createModel('color', {name: String});
      var models = app.models();
      
      assert.equal(models.length, 1);
      assert.equal(models[0].modelName, 'color');
    });
  });
});