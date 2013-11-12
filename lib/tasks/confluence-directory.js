var https = require("https");
var q = require("q");
var request = require('request');
var fs = require('fs');

module.exports = function (nigel) {
    // Should actually be pulled from confluence
    var directoryJson = __dirname + "/directory.json";

    function directoryList(nigel, params) {
        console.log(params);
        var contents = fs.readFileSync(directoryJson).toString();
        var directory = JSON.parse(contents);
        var deferred = q.defer();
        var result = "";
        var filtered = [];
        var firstName;
        var lastName;
        for (var i = 0; i < directory.length; i++) {
            firstName = directory[i].firstName;
            lastName = directory[i].lastName;
            if (!params.q || firstName.indexOf(params.q) >= 0 || lastName.indexOf(params.q) >= 0) {
                result += firstName + " " + lastName + "\n";
                filtered.push(directory[i]);
            }
        }
        if (params.format !== "plain") {
            result = filtered;
        }
        deferred.resolve(result);
        return deferred.promise;
    }

    function directorySearch(nigel, params) {
    }

    nigel.registerTask("list", "Lists all the people in the directory [q to filter the list by string]", directoryList);
};
