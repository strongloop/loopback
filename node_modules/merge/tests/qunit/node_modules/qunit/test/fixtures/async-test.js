test('1', 1, function (){
  ok(true, "tests intermixing sync and async tests #1")
});

test('a', 2, function(){
    stop();

    setTimeout(function() {
        ok(true, 'test a1');
        ok(true, 'test a2');
        start();
    }, 10000);
})

test('2', 1, function (){
  ok(true, "tests intermixing sync and async tests #2")
});

test('b', 2, function(){
    stop();

    setTimeout(function() {
        ok(true, 'test b1');
        ok(true, 'test b2');
        start();
    }, 10);
})
