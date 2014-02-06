var https = require("https");
var q = require("q");
var request = require('request');
var parseXlsx = require('excel');

module.exports = function (nigel, config, register) {
    // Should actually be pulled from confluence

    function test(queries, fields) {
        if (queries.length) {
            return fields.some(function (val) {
                return queries.some(function (q) {
                    if (val.indexOf(q) > -1) {
                        return true;
                    }
                });
            });
        }
    }

    function search(message, outputStream, session) {
        nigel.auth.get("confluence-csv", session).then(function(auth) {
            var stream = request({
                url: config.url,
                json: true,
                auth: auth
            });
            parseXlsx(stream, function (err, data) {
                if (err) {
                    outputStream.end("Error reading contacts. Sorry!");
                } else {
                    var header = data[0];
                    var out = "First, Last, Phone\n";
                    message = message ? message.split(' ') : [];
                    data.forEach(function (row, idx) {
                        if (idx >= 1 && (message.length == 0 || test(message, row))) {
                            out += row[0] + " " + row[1] + ": " + row[3] + (row[4] ? "x" + row[4] : "") + "\n";
                        }
                    });
                    outputStream.end(out);
                }
            });
        });
    }

    register("*", [], "Search through a CSV", search);
};
