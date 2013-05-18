var myModule = require('./');

myModule.hello(); // hello world (via config.json's options.msg)

var anotherModule = require('../another-module');

anotherModule.foo();