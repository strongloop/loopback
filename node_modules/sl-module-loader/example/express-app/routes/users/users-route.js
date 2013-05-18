var MODULE_LOADER = '../../../../';
var Module = require(MODULE_LOADER).Module;
var inherits = require('util').inherits;

module.exports = UsersRoute;

function UsersRoute(options) {
  Module.apply(this, arguments);
}

inherits(UsersRoute, Module);

UsersRoute.prototype.handle = function (req, res, next) {
  var user = this.dependencies.user;
  
  user.getAll(function (err, users) {
    if(err) {
      next(err);
    } else {
      res.send(users);  
    }
  });
}

UsersRoute.dependencies = {
  'user': 'data-model'
}