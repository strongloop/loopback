var Table = require('cli-table');

var data,
    log = console.log;

data = {
    assertions: [],
    tests: [],
    summaries: []
};

exports.assertion = function(d) {
    if (d) {
        data.assertions.push(d);
    }

    return data.assertions;
};

exports.test = function(d) {
    if (d) {
        data.tests.push(d);
    }

    return data.tests;
};

exports.summary = function(d) {
    if (d) {
        data.summaries.push(d);
    }

    return data.summaries;
};

/**
 * Get global tests stats in unified format
 */
exports.stats = function() {
    var stats = {
            files: 0,
            assertions: 0,
            failed: 0,
            passed: 0,
            runtime: 0
        };

    data.summaries.forEach(function(file) {
        stats.files++;
        stats.assertions += file.total;
        stats.failed += file.failed;
        stats.passed += file.passed;
        stats.runtime += file.runtime;
    });

    stats.tests = data.tests.length;

    return stats;
};

/**
 * Reset global stats data
 */
exports.reset = function() {
    data = {
        assertions: [],
        tests: [],
        summaries: []
    };
};

var print = exports.print = {};

print.assertions = function() {
    var table,
        currentModule, module,
        currentTest, test;

    table = new Table({
        head: ['Module', 'Test', 'Assertion', 'Result'],
        colWidths: [40, 40, 40, 8]
    });

    data.assertions.forEach(function(data) {
        // just easier to read the table
        if (data.module === currentModule) {
            module = '';
        } else {
            module = currentModule = data.module;
        }

        // just easier to read the table
        if (data.test === currentTest) {
            test = '';
        } else {
            test = currentTest = data.test;
        }

        table.push([module, test, data.message, data.result ? 'ok' : 'fail']);
    });

    log('\nAssertions:\n' + table.toString());
};

print.errors = function() {
    var errors = [];

    data.assertions.forEach(function(data) {
        if (!data.result) {
            errors.push(data);
        }
    });

    if (errors.length) {
        log('\n\nErrors:');
        errors.forEach(function(data) {
            log('\nModule: ' + data.module + ' Test: ' + data.test);
            if (data.message) {
                log(data.message);
            }

            if (data.source) {
                log(data.source);
            }

            if (data.expected != null || data.actual != null) {
                //it will be an error if data.expected !== data.actual, but if they're
                //both undefined, it means that they were just not filled out because
                //no assertions were hit (likely due to code error that would have been logged as source or message).
                log('Actual value:');
                log(data.actual);
                log('Expected value:');
                log(data.expected);
            }
        });
    }
};

print.tests = function() {
    var table,
        currentModule, module;

    table = new Table({
        head: ['Module', 'Test', 'Failed', 'Passed', 'Total'],
        colWidths: [40, 40, 8, 8, 8]
    });

    data.tests.forEach(function(data) {
        // just easier to read the table
        if (data.module === currentModule) {
            module = '';
        } else {
            module = currentModule = data.module;
        }

        table.push([module, data.name, data.failed, data.passed, data.total]);
    });

    log('\nTests:\n' + table.toString());
};

print.summary = function() {
    var table, fileColWidth = 50;

    table = new Table({
        head: ['File', 'Failed', 'Passed', 'Total', 'Runtime'],
        colWidths: [fileColWidth + 2, 10, 10, 10, 10]
    });

    data.summaries.forEach(function(data) {
        var code = data.code;

        // truncate file name
        if (code.length > fileColWidth) {
            code = '...' + code.slice(code.length - fileColWidth + 3);
        }

        table.push([code, data.failed, data.passed, data.total, data.runtime]);
    });

    log('\nSummary:\n' + table.toString());
};

print.globalSummary = function() {
    var table,
        data = exports.stats();

    table = new Table({
        head: ['Files', 'Tests', 'Assertions', 'Failed', 'Passed', 'Runtime'],
        colWidths: [12, 12, 12, 12, 12, 12]
    });

    table.push([data.files, data.tests, data.assertions, data.failed,
        data.passed, data.runtime]);

    log('\nGlobal summary:\n' + table.toString());
};
