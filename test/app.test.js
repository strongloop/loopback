var asteroid = require('../');

describe('app', function(){
  var app;
  
  beforeEach(function () {
    app = asteroid();
  });
  
  describe('asteroid.createModel(name, properties, settings)', function(){
    var User = asteroid.createModel('user', {
      first: String,
      last: String,
      age: Number
    });
  });
});