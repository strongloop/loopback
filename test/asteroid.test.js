describe('asteroid', function() {
  describe('asteroid.createDataSource(options)', function(){
    it('Create a data sources with a connector.', function(done) {
      done(new Error('not implemented'));
    });
  });
  
  describe('asteroid.remoteMethod(Model, fn, [options]);', function() {
    it("Expose a remote method.", function(done) {
      /* example - 
      Product.stats = function(fn) {
        myApi.getStats('products', fn);
      }
      
      asteroid.remoteMethod(
        Product,
        Product.stats,
        {
          returns: {arg: 'stats', type: 'array'},
          http: {path: '/info', verb: 'get'}
        }
      );
      // examples
      {arg: 'myArg', type: 'number'}
      [
        {arg: 'arg1', type: 'number', required: true},
        {arg: 'arg2', type: 'array'}
      ]
      User.before('save', function(user, next) {
        console.log('about to save', user);
        
        next();
      });
      
      User.before('delete', function(user, next) {
        // prevent all delete calls
        next(new Error('deleting is disabled'));
      });
      User.beforeRemote('save', function(ctx, user, next) {
        if(ctx.user.id === user.id) {
          next();
        } else {
          next(new Error('must be logged in to update'))
        }
      });
      
      */
      done(new Error('test not implemented'));
    });
  });
});