// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Module Dependencies.
 */

module.exports = KeyValueModel;

var Model = KeyValueModel;

function Model(registry) {
  this.registry = registry;
}

// Static

Model.get = function get(key) {
  // ret val by key
}

Model.expire
Model.expires = function() {
  // ret remaining ttl/expires time
}

Model.delete =
Model.remove = function(key) {
  // del val by key
}

Model.set = function get(key) {
  // set val by key
}

Model.touch = function touch(ttl) {
  // renew ttl to given ttl, use now if ttl is not given
}

// Instance

Model.prototype.delete = function() {
}

Model.prototype.get = function() {
  // use id from inst to ret latest ver from backend
};

Model.prototype.getExpirationTime() {
  // return expiration time (UTC timestamp)
};

Model.prototype.set = function(ttl) {
  // use id from inst and call touch for the instance
};

Model.prototype.touch = function() {
};
