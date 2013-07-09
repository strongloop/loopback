var ModelBuilder = require('jugglingdb').ModelBuilder;

var ds = new ModelBuilder();

exports.Application = require('./application')(ds);
exports.ACL = require('./acl')(ds);
exports.Role = require('./role')(ds);
exports.Installation = require('./installation')(ds);

/*
console.log(new exports.Role());
console.log(new exports.ACL());
console.log(new exports.Application());
console.log(new exports.Installation());
*/

