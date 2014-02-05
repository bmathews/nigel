
var streams = require('stream');
var tasks = [];


function XMPPProtocol (config) {
    var xmpp = this.xmpp = require('simple-xmpp');

    xmpp.on('online', function() {
        console.log('Yes, I\'m connected!');
    });

    xmpp.on('chat', function(from, message) {
        tasks.forEach(function (task) {
            task(from, message);
        });
    });

    xmpp.on('error', function(err) {
        console.error(err);
    });
    xmpp.on('stanza', function (msg) {
        
    });

    xmpp.connect(config);
}

XMPPProtocol.prototype.registerTask = function (namespaces, taskFunc) {
    console.log("XMPP: Registering task: " + namespaces.join(' '));
    var xmpp = this.xmpp;
    tasks.push(function (from, message) {
        var stream;
        var idx = message.indexOf(namespaces.join(' '));
        if (idx === 0) {
            stream = streams.Writable({ decodeStrings: false });
            stream._write = function (chunk, enc, next) {
                xmpp.send(from, chunk);
                next();
                console.log(chunk);
            };
            taskFunc(message.substr(namespaces.join(' ').length).trim(), stream)
        }
    });
};

module.exports = XMPPProtocol;