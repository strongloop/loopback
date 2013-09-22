/**
 * Export the middleware.
 */

module.exports = jsonrpc;

/**
 * Build a temp app for mounting resources.
 */

function jsonrpc() {
    return function (req, res, next) {
        var app = req.app;
        var handler = ('function' === typeof app.handler) && app.handler('jsonrpc');
        if (handler) {
            handler(req, res, next);
        } else {
            next();
        }
    };
}

