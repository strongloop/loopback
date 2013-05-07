
test("Dependency file required as global", function() {
    equal(typeof whereFrom, "function");
    equal(whereFrom(), "I was required as global");
});
