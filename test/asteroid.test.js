var Asteroid = require('../');

describe('Asteroid', function(){
  var asteroid;
  
  beforeEach(function(){
    asteroid = new Asteroid;
  });
  
  describe('.myMethod', function(){
    // example sync test
    it('should <description of behavior>', function() {
      asteroid.myMethod();
    });
    
    // example async test
    it('should <description of behavior>', function(done) {
      setTimeout(function () {
        asteroid.myMethod();
        done();
      }, 0);
    });
  });
});