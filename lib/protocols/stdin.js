var streams = require('stream');
var tasks = [];

function STDINProtocol (port) {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function (chunk) {
        tasks.forEach(function (task) {
            task(chunk);
        });
    });
}

STDINProtocol.prototype.registerTask = function (namespaces, taskFunc, nigel) {
    console.log("STDIN: Registering task: " + namespaces.join(' '));
    tasks.push(function (chunk) {
        var message = String(chunk);
        var stream;
        var idx = message.indexOf(namespaces.join(' '));
        if (idx === 0) {
            stream = streams.Writable({ decodeStrings: false });
            stream._write = function (chunk, enc, next) {
                process.stdout.write(String(chunk) + "\n");
                next();
            };
            taskFunc(message.substr(namespaces.join(' ').length).trim(), stream, nigel.startSession(1));
        }
    });
};

module.exports = STDINProtocol;