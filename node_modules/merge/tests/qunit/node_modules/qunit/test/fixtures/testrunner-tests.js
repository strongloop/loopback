test('myMethod test', function() {
    equal(myMethod(), 123, 'myMethod returns right result');
    equal(myMethod(), 321, 'this should trigger an error');
})

test('myAsyncMethod test', function() {
    ok(true, 'myAsyncMethod started');

    stop();
    expect(3);

    myAsyncMethod(function(data) {
        equal(data, 123, 'myAsyncMethod returns right result');
        equal(data, 321, 'this should trigger an error');
        start();
    });
})

test('circular reference', function() {
    equal(global, global, 'test global');
});

test('use original Date', function() {
    var timekeeper = require('timekeeper');

    timekeeper.travel(Date.now() - 1000000);

    ok(true, 'date modified');
});
