module.exports = browserExpress;

function browserExpress() {
  return new BrowserExpress();
}

browserExpress.errorHandler = {};

function BrowserExpress() {
  this.settings = {};
}

BrowserExpress.prototype.set = function(key, value) {
  if (arguments.length == 1) {
    return this.get(key);
  }

  this.settings[key] = value;

  return this; // fluent API
};

BrowserExpress.prototype.get = function(key) {
  return this.settings[key];
};
