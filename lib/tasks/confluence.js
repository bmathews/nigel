var https = require("https");
var q = require("q");
var request = require('request');

module.exports = function (nigel) {
    var searchUrl = "rest/prototype/1/search.json";
    var spaceUrl = "rest/prototype/1/space";

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
                query: params.q,
                spaceKey: params.spaceKey || ""
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

    function space(nigel, params) {
        var deferred = q.defer();
        var url = params.url + spaceUrl + (params.space ? "/" + params.space : params.spaceKey ? "/" + params.spaceKey : "") + ".json";
        request({
            url: url,
            auth: {
                user: params.user,
                pass: params.pass
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

    nigel.registerTask("search", "Searches confluence with [query]", search);
    nigel.registerTask("space", "Loads default space or [space]", space);
};
