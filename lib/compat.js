var assert = require('assert');

/**
 * Compatibility layer allowing applications based on an older LoopBack version
 * to work with newer versions with minimum changes involved.
 *
 * You should not use it unless migrating from an older version of LoopBack.
 */

var compat = exports;

/**
 * LoopBack versions pre-1.6 use plural model names when registering shared
 * classes with strong-remoting. As the result, strong-remoting use method names
 * like `Users.create` for the javascript methods like `User.create`.
 * This has been fixed in v1.6, LoopBack consistently uses the singular
 * form now.
 *
 * Turn this option on to enable the old behaviour.
 *
 *   - `app.remotes()` and `app.remoteObjects()` will be indexed using
 *      plural names (Users instead of User).
 *
 *   - Remote hooks must use plural names for the class name, i.e
 *     `Users.create` instead of `User.create`. This is transparently
 *     handled by `Model.beforeRemote()` and `Model.afterRemote()`.
 *
 * @type {boolean}
 * @deprecated Your application should not depend on the way how loopback models
 *   and strong-remoting are wired together. It if does, you should update
 *   it to use singular model names.
 */

compat.usePluralNamesForRemoting = false;

/**
 * Get the class name to use with strong-remoting.
 * @param {function} Ctor Model class (constructor), e.g. `User`
 * @return {string} Singular or plural name, depending on the value
 *   of `compat.usePluralNamesForRemoting`
 * @internal
 */

compat.getClassNameForRemoting = function(Ctor) {
  assert(
    typeof(Ctor) === 'function',
    'compat.getClassNameForRemoting expects a constructor as the argument');

  if (compat.usePluralNamesForRemoting) {
    assert(Ctor.pluralModelName,
      'Model must have a "pluralModelName" property in compat mode');
    return Ctor.pluralModelName;
  }

  return Ctor.modelName;
};
