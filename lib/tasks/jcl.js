var https = require("https");
var q = require("q");
var spawn = require('child_process').spawn;


module.exports = function (nigel) {
    function run(nigel, params, outStream) {
        var deferred = q.defer();
        var args = [];

        // for (var prop in params.args) {
        //     args.push(prop);
        //     args.push(params.args[prop]);
        // }

        console.log("jcl " + params.args);

        var proc = spawn("jcl", params.args.split(" "));
        var out = "";

        proc.stdout.on('data', function (data) {
            out += data;
        });

        proc.stderr.on('data', function (data) {
            out += data;
        });

        proc.on('close', function (code) {
            deferred.resolve(out);
        });

        return deferred.promise;
    }

    nigel.registerTask("", "spawn jcl", run)
};
