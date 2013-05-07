exports.myMethod = function() {
    return 123;
};

exports.myAsyncMethod = function(callback) {
    setTimeout(function() {
        callback(123);
    }, 100);
};