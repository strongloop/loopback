# sl-module-loader
v0.0.1

## Purpose

The `sl-module-loader` allows your program to register classes (or types) that are instantiated via configuration files. Configuration files point to an implementation `module` constructor. The `module`'s job is to construct a useful instance with the given configuration options. This allows programs to be free from bootstrapping code and manageable via config.

## Install

    slnode install sl-module-loader
    
## Example

Given a simple `Dog` module:

    function Dog(options) {
      this.options = options;
    }
  
    Dog.prototype.speak = function() {
      console.log('roof', 'my name is', this.options.name);
    }
    
    module.exports = Dog;

And a set of `config.json` files:

    /my-app
      /fido
        config.json
      /santas-little-helper
        config.json
      /rex
        config.json
      /node_modules
        /dog
          index.js
      package.json

Where a `config.json` looks like this:

    {
      "module": "dog", // the "dog" module
      "options": {
        "name": "fido"
      }
    }

We can load up all the dogs like so (app.js):

    var moduleLoader = require('sl-module-loader').create('my-app');

    moduleLoader.load(function (err, modules) {
      if(err) throw err;
  
      moduleLoader
        .instanceOf('dog') // a module in node_modules or declared as a dependency in package.json
        .forEach(function (m) {
          m.speak();
        });
    });
    
The above calls a method on all module instances that inherit from `Dog` and outputs:

    roof my name is fido
    roof my name is santa's little helper
    roof my name is rex

## Creating Module Classes

The purpose of a module class is to take meaningful input (configuration, options, dependencies) and create a useful output: a module instance.

### Module Classes

A module class is a `node_module` that exports a constructor inheriting from the `Module` class.

    var inherits = require('util').inherits;
    var Module = require('sl-module-loader').Module;

    module.exports = Dog;

    function Dog(options) {
      this.options = options;
    }

    inherits(Dog, Module);

    Dog.prototype.speak = function() {
      console.log('roof', 'my name is', this.options.name);
    }

Module classes may define dependency contracts that tell the module loader to provide dependencies of a given module class during construction.

    function MyComplexModule() {
      Module.apply(this, arguments);
      console.log('loaded dependencies', this.dependencies); // {'my-dependency': <module instance>}
    }

    MyComplexModule.dependencies = {
      'my-dependency': 'another-module-class'
    }

#### Module Class Options

Module classes may also describe the options they accept. This will validate the configuration of module instance and guarantee the module class constructor has enough information to construct an instance.

Here is an example options description for a database connection module class.

    DatabaseConnection.options = {
      'hostname': {type: 'string', required: true},
      'port': {type: 'number', min: 10, max: 99999},
      'username': {type: 'string'},
      'password': {type: 'string'}
    };

**key** the option name given in `config.json`.

**type** must be one of:

 - string
 - boolean
 - number
 - array

**min/max** depend on the option type

    {
      min: 10, // minimum length or value
      max: 100, // max length or value
    }

#### Module Events

Module classes may also emit and listen to events. By default a Module will emit the following events:

**destroy**

Emitted when a module instance is being destroyed during a `moduleLoader.reset()`. Modules should cleanup any connections and unbind all event listeners.

### Configuration

Each module instance is defined by creating a `config.json` file in a directory with the module's name.

    /my-module-instance
      config.json
      other-files.txt
      index.js
      
This directory should contain files related to the module instance. For example it might contain a script that `require()`s the module instance. 

#### config.module

The node module name that exports the module class that constructs the config's module instance.

    {
      "module": "my-module-class"
    }

#### config.options

Defines arbitrary options. A `file-upload` module might have an `uploads` option.

    {
      "module": "file-upload",
      "options": {
        "uploads": "/tmp"
      }
    }

#### config.dependencies

Defines other module instances the configured instance depends on.

    {
      "module": "collection"
      "dependencies": {
        "db": "my-db-module"
      },
      "options": {
        "collection-name": "my-collection"
      }
    }

Where `my-db-module`'s config looks like this:

    {
      "module": "couchdb-connector",
      "options": {
        "database": "my-db"
      }
    }
    
#### config.env.json

Separate file that overrides `config.json` depending on the current `NODE_ENV`. Useful for including config information that is environment specific or should not be committed to source control.

    {
      // overrides for all envs
      "*": {
        "options": {
          "upload-dir": "/uploads"
        }
      },
      "dev": {
        "options": {
          "upload-dir": "/dev-uploads"
        }
      }
    }

## Requiring Modules

To use module instances, you can `require()` them anywhere in your program like you normally would require a node module. For example, you can get a reference to the `fido` object like this:

    var fido = require('fido'); // `fido` is the directory name containing the fido module config

### Require Behavior

After your program runs `require('sl-module-loader')` the `require()` function's behavior will change slightly to make referencing module instances simpler. Since some module instances may not have any program specific code, they can't be `require()`d with `node`'s existing require() implementation.
    
## Config Loader

`sl-module-loader` inherits from [sl-config-loader](https://github.com/strongloop/sl-config-loader).


## Bundled Modules / Aliasing

Some modules need to be distributed together. For example, you have a set of related modules that all live under a single version number since they depend on features from each other. In this case you should bundle your sub modules using the package.json `bundledDependencies` array.

Reference bundled modules by relative location (just like require).

    // config.json
    {
      "module": "myBundle/node_modules/foo"
    }

You may also provide aliases to any module path when creating a `ModuleLoader`.

    var moduleLoader = require('sl-module-loader').create('my-app', {alias: {'foo': 'myBundle/node_modules/foo'}});

Now the config can reference `foo` instead of the qualified path.

    // config.json
    {
      "module": "foo"
    }