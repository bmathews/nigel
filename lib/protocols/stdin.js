var streams = require('stream');

function STDINProtocol (port) {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
}

STDINProtocol.prototype.registerTask = function (namespaces, taskFunc) {
    console.log("STDIN: Registering task: " + namespaces.join(' '));
    process.stdin.on('data', function (chunk) {
        var message = String(chunk);
        var stream;
        var idx = message.indexOf(namespaces.join(' '));
        if (idx === 0) {
            stream = streams.Writable({ decodeStrings: false });
            stream._write = function (chunk, enc, next) {
                process.stdout.write(String(chunk) + "\n");
                next();
            };
            taskFunc(message.substr(namespaces.join(' ').length).trim(), stream)
        }
    });
};

module.exports = STDINProtocol;