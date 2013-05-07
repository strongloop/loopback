test("Dependency file required as a namespace object", function() {
    strictEqual(typeof testns != "undefined", true);
    equal(typeof testns.whereFrom, "function", "right method attached to right object");
    equal(testns.whereFrom(), "I was required as a namespace object");
});
