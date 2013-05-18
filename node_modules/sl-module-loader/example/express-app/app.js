/**
 * Main application
 */

var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();

var ModuleLoader = require('../../');

var ml = ModuleLoader.create('.', {ttl: 0, ignore: ['node_modules']});

var options = {};

app.set('port', process.env.PORT || 3000);

app.use(function (req, res, next) {
  ml.load(function (err, config) {
    if(err) {
      throw err;
    } else {
      // simple routing
      var module = ml.getByName(req.url.replace('/', ''));
      
      if(module) {
        module.handle(req, res, next);
      } else {
        next();
      }
    }
  });
});

app.use(app.router);

http.createServer(app).listen(app.get('port'), function(){
  console.log("express-app listening on port " + app.get('port'));
});

