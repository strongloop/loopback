describe('DataSource', function() {
  var memory;
  
  beforeEach(function(){
    memory = loopback.createDataSource({
      connector: loopback.Memory
    });
    
    assertValidDataSource(memory);
  });

  describe('dataSource.createModel(name, properties, settings)', function() {
    it("Define a model and attach it to a `DataSource`", function() {
      var Color = memory.createModel('color', {name: String});
      assert.isFunc(Color, 'find');
      assert.isFunc(Color, 'findById');
      assert.isFunc(Color, 'findOne');
      assert.isFunc(Color, 'create');
      assert.isFunc(Color, 'updateOrCreate');
      assert.isFunc(Color, 'upsert');
      assert.isFunc(Color, 'findOrCreate');
      assert.isFunc(Color, 'exists');
      assert.isFunc(Color, 'destroyAll');
      assert.isFunc(Color, 'count');
      assert.isFunc(Color, 'include');
      assert.isFunc(Color, 'relationNameFor');
      assert.isFunc(Color, 'hasMany');
      assert.isFunc(Color, 'belongsTo');
      assert.isFunc(Color, 'hasAndBelongsToMany');
      assert.isFunc(Color.prototype, 'save');
      assert.isFunc(Color.prototype, 'isNewRecord');
      assert.isFunc(Color.prototype, 'destroy');
      assert.isFunc(Color.prototype, 'updateAttribute');
      assert.isFunc(Color.prototype, 'updateAttributes');
      assert.isFunc(Color.prototype, 'reload');  
    });
  });

  describe.skip('DataModel Methods', function() {
    it("List the enabled and disabled methods", function() {
      var TestModel = loopback.DataModel.extend('TestDataModel');
      TestModel.attachTo(loopback.memory());
      
      // assert the defaults
      // - true: the method should be remote enabled
      // - false: the method should not be remote enabled
      // - 
      existsAndShared(TestModel, '_forDB', false);
      existsAndShared(TestModel, 'create', true);
      existsAndShared(TestModel, 'updateOrCreate', true);
      existsAndShared(TestModel, 'upsert', true);
      existsAndShared(TestModel, 'findOrCreate', false);
      existsAndShared(TestModel, 'exists', true);
      existsAndShared(TestModel, 'find', true);
      existsAndShared(TestModel, 'findOne', true);
      existsAndShared(TestModel, 'destroyAll', false);
      existsAndShared(TestModel, 'count', true);
      existsAndShared(TestModel, 'include', false);
      existsAndShared(TestModel, 'relationNameFor', false);
      existsAndShared(TestModel, 'hasMany', false);
      existsAndShared(TestModel, 'belongsTo', false);
      existsAndShared(TestModel, 'hasAndBelongsToMany', false);
      // existsAndShared(TestModel.prototype, 'updateAttributes', true);
      existsAndShared(TestModel, 'save', false, true);
      existsAndShared(TestModel, 'isNewRecord', false, true);
      existsAndShared(TestModel, '_adapter', false, true);
      existsAndShared(TestModel, 'destroy', false, true);
      existsAndShared(TestModel, 'reload', false, true);
      
      function existsAndShared(Model, name, isRemoteEnabled, isProto) {
        var scope = isProto ? Model.prototype : Model;
        var fn = scope[name];
        var actuallyEnabled = Model.getRemoteMethod(name);
        assert(fn, name + ' should be defined!');
        assert(actuallyEnabled === isRemoteEnabled, name + ' ' + (isRemoteEnabled ? 'should' : 'should not') + ' be remote enabled');
      }
    });
  });
});
