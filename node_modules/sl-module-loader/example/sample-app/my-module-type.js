module.exports = MyModuleType;

function MyModuleType(options) {
  this.options = options;
}

MyModuleType.prototype.speak = function () {
  console.log(this.options.msg || 'no message provided...');
}