var https = require("https");
var q = require("q");
var spawn = require('child_process').spawn;


module.exports = function (nigel, config, register) {
    function run(message, outputStream) {

        var proc = spawn("jcl", message ? message.split(' ') : []);
        var out = "";

        proc.stdout.on('data', function (data) {
            out += data;
        });

        proc.stderr.on('data', function (data) {
            out += data;
        });

        proc.on('close', function (code) {
            outputStream.end(out)
        });
    }

    register("*", [], "Jira command line tool", run)
};
