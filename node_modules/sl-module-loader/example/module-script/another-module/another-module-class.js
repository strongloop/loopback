module.exports = AnotherModuleClass;

function AnotherModuleClass(options) {
  this.options = options;
}

AnotherModuleClass.prototype.foo = function () {
  console.log('foo', this.options.msg);
}