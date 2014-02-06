function HTTPProtocol () { }
HTTPProtocol.prototype.registerTask = function (namespaces, taskFunc, nigel) {
    console.log("HTTP: Registering task: /%s", namespaces.join('/').replace(new RegExp(" ", "g"), "/"));
    nigel.server.get("/" + namespaces.join('/').replace(new RegExp(" ", "g"), "/"), function (req, res) {
        taskFunc(req.query.q, res, nigel.startSession(req.session.id));
    });
};

module.exports = HTTPProtocol;