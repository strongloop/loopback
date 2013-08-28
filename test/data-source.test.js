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

  describe('dataSource.operations()', function() {
    it("List the enabled and disabled operations", function() {
      // assert the defaults
      // - true: the method should be remote enabled
      // - false: the method should not be remote enabled
      // - 
      existsAndShared('_forDB', false);
      existsAndShared('create', true);
      existsAndShared('updateOrCreate', true);
      existsAndShared('upsert', true);
      existsAndShared('findOrCreate', false);
      existsAndShared('exists', true);
      existsAndShared('find', true);
      existsAndShared('findOne', true);
      existsAndShared('destroyAll', false);
      existsAndShared('count', true);
      existsAndShared('include', false);
      existsAndShared('relationNameFor', false);
      existsAndShared('hasMany', false);
      existsAndShared('belongsTo', false);
      existsAndShared('hasAndBelongsToMany', false);
      existsAndShared('save', false);
      existsAndShared('isNewRecord', false);
      existsAndShared('_adapter', false);
      existsAndShared('destroyById', true);
      existsAndShared('destroy', false);
      existsAndShared('updateAttributes', true);
      existsAndShared('reload', false);
      
      function existsAndShared(name, isRemoteEnabled) {
        var op = memory.getOperation(name);
        assert(op.remoteEnabled === isRemoteEnabled, name + ' ' + (isRemoteEnabled ? 'should' : 'should not') + ' be remote enabled');
      }
    });
  });
});
