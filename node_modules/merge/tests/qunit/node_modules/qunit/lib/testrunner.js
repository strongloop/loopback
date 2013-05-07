var fs = require('fs'),
    path = require('path'),
    coverage = require('./coverage'),
    cp = require('child_process'),
    _ = require('underscore'),
    log = exports.log = require('./log'),
    util = require('util');

var options,
    noop = function() {};

options = exports.options = {

    // logging options
    log: {

        // log assertions overview
        assertions: true,

        // log expected and actual values for failed tests
        errors: true,

        // log tests overview
        tests: true,

        // log summary
        summary: true,

        // log global summary (all files)
        globalSummary: true,

        // log currently testing code file
        testing: true
    },

    // run test coverage tool
    coverage: false,

    // define dependencies, which are required then before code
    deps: null,

    // define namespace your code will be attached to on global['your namespace']
    namespace: null
};

/**
 * Run one spawned instance with tests
 * @param {Object} opts
 * @param {Function} callback
 */
function runOne(opts, callback) {
    var child;

    child = cp.fork(
        __dirname + '/child.js',
        [JSON.stringify(opts)],
        {env: process.env}
    );

    function kill() {
        process.removeListener('exit', kill);
        child.kill();
    }

    child.on('message', function(msg) {
        if (msg.event === 'assertionDone') {
            log.assertion(msg.data);
        } else if (msg.event === 'testDone') {
            log.test(msg.data);
        } else if (msg.event === 'done') {
            msg.data.code = opts.code.path;
            log.summary(msg.data);
            if (opts.log.testing) {
                util.print('done');
            }
            callback(null, msg.data);
            kill();
        } else if (msg.event === 'uncaughtException') {
            callback(new Error('Uncaught exception in child process.'));
            kill();
        }
    });

    process.on('exit', kill);

    if (opts.log.testing) {
        util.print('\nTesting ', opts.code.path + ' ... ');
    }
}

/**
 * Make an absolute path from relative
 * @param {string|Object} file
 * @return {Object}
 */
function absPath(file) {
    if (typeof file === 'string') {
        file = {path: file};
    }

    if (file.path.charAt(0) != '/') {
        file.path = path.resolve(process.cwd(), file.path);
    }

    return file;
}

/**
 * Convert path or array of paths to array of abs paths
 * @param {Array|string} files
 * @return {Array}
 */
function absPaths(files) {
    var ret = [];

    if (Array.isArray(files)) {
        files.forEach(function(file) {
            ret.push(absPath(file));
        });
    } else if (files) {
        ret.push(absPath(files));
    }

    return ret;
}

/**
 * Run tests in spawned node instance async for every test.
 * @param {Object|Array} files
 * @param {Function} callback optional
 */
exports.run = function(files, callback) {
    var filesCount = 0;

    callback || (callback = noop);

    if (!Array.isArray(files)) {
        files = [files];
    }

    files.forEach(function(file) {
        var opts =  _.extend({}, options, file);

        !opts.log && (opts.log = {});
        opts.deps = absPaths(opts.deps);
        opts.code = absPath(opts.code);
        opts.tests = absPaths(opts.tests);

        function done(err, stat) {
            if (err) {
                return callback(err);
            }

            filesCount++;

            if (filesCount >= files.length) {
                _.each(opts.log, function(val, name) {
                    if (val && log.print[name]) {
                        log.print[name]();
                    }
                })

                callback(null, log.stats());
            }
        }

        if (opts.coverage) {
            coverage.instrument(opts.code);
        } else {
            runOne(opts, done);
        }
    });
};


/**
 * Set options
 * @param {Object}
 */
exports.setup = function(opts) {
    _.extend(options, opts);
};
