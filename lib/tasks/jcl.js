var https = require("https");
var q = require("q");
var spawn = require('child_process').spawn;


<<<<<<< HEAD

module.exports = function (nigel, config, register) {
    function run(message, outputStream) {

        console.log("jcl " + message);

        var proc = spawn("jcl", message.split(' '));
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
