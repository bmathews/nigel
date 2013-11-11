var https = require("https");
var q = require("q");
var request = require('request');

module.exports = function (nigel) {
    var searchUrl = "rest/prototype/1/search.json"

    function search(nigel, params, outStream) {
        var deferred = q.defer();
        var url = params.url + searchUrl;

        request({
            url: url,
            auth: {
                user: params.user,
                pass: params.pass
            },
            qs: {
                query: params.q
            }
        }, function (error, response, body) {
            if (response.statusCode == 200) {
                deferred.resolve(body);
            } else {
                deferred.reject(error);
            }
        });
        return deferred.promise;
    }

    nigel.registerTask("search", "Searches confluence", search);
};
