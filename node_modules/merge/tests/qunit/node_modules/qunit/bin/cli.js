#!/usr/bin/env node

var util = require('util'),
    argsparser = require('argsparser'),
    fs = require('fs');

var root = __dirname + '/..',
    args = argsparser.parse(),
    testrunner = require(root),
    o = testrunner.options,
    code, tests,
    help;

help = ''
    + '\nUsage: cli [options] value (boolean value can be used)'
    + '\n'
    + '\nOptions:'
    + '\n -c, --code path to code you want to test'
    + '\n -t, --tests path to tests (space separated)'
    + '\n -d, --deps dependency paths - files required before code (space separated)'
    + '\n -l, --log logging options, json have to be used'
    + '\n --cov create tests coverage report'
    + '\n -h, --help show this help'
    + '\n -v, --version show module version'
    + '\n';

/**
 * Parses a code or dependency argument, returning an object defining the
 * specified file path or/and module name.
 * The exports of the module will be exposed globally by default. To expose
 * exports as a named variable, prefix the resource with the desired variable
 * name followed by a colon.
 * This allows you to more accurately recreate browser usage of QUnit, for
 * tests which are portable between browser runtime environmemts and Node.js.
 * @param {string} path to file or module name to require.
 * @return {Object} resource
 */
function parsePath(path) {
    var parts = path.split(':'),
        resource = {
            path: path
        };

    if (parts.length === 2) {
        resource.namespace = parts[0];
        resource.path = parts[1];
    }

    return resource;
}

for (var key in args) {
    switch(key) {
		case 'node':
			// Skip the 'node' argument
			break;
        case '-c':
        case '--code':
            code = parsePath(args[key]);
            break;
        case '-t':
        case '--tests':
            // it's assumed that tests arguments will be file paths whose
            // contents are to be made global. This is consistent with use
            // of QUnit in browsers.
            tests = args[key];
            break;
        case '-d':
        case '--deps':
            o.deps = args[key];
            if (!Array.isArray(o.deps)) {
                o.deps = [o.deps];
            }
            o.deps = o.deps.map(parsePath);
            break;
        case '-l':
        case '--log':
            eval('o.log = ' + args[key]);
            break;
        case '--cov':
            o.coverage = args[key];
            break;
        case '-p':
        case '--paths':
            o.paths = args[key];
            break;
        case '-v':
        case '--version':
            util.print(
                JSON.parse(
                    fs.readFileSync(__dirname + '/../package.json')
                ).version + '\n'
            );
            return;
        case '-h':
        case '-?':
        case '--help':
            util.print(help);
            return;
    }
}
if(!code || !tests) {
	util.print(help);
	util.print('\nBoth --code and --tests arguments are required\n');
	return;
}

testrunner.run({ code: code, tests: tests }, function(err, stats) {
    if (err) {
        console.error(err);
        process.exit(1);
        return;
    }

    process.exit(stats.failed > 0 ? 1 : 0);
});
