/**
 * not yet supported...
 */

var modules = require('modules');
var currentModule = modules(__dirname);

console.log('this script is executed after a module is constructed');
console.log('currentModule', currentModule);