module.exports = MyModuleClass;

function MyModuleClass(options) {
  this.options = options;
}

MyModuleClass.prototype.hello = function () {
  console.log(this.options.msg);
}
