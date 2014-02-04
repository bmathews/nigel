var express = require('express');

function HTTPProtocol (port) {
    var app = this.app = express();
    app.listen(port);
    console.log("HTTP: listening on port: %s", port);
}

HTTPProtocol.prototype.registerTask = function (namespaces, taskFunc) {
    console.log("HTTP: Registering task: /%s", namespaces.join('/').replace(new RegExp(" ", "g"), "/"));
    this.app.get("/" + namespaces.join('/').replace(new RegExp(" ", "g"), "/"), function (req, res) {
        taskFunc(req.query.q, res);
    });
};

module.exports = HTTPProtocol;