var https = require("https");
var q = require("q");
var request = require('request');

module.exports = function (nigel) {
    var projectBuildInfoUrl = "/job/{{projectName}}/{{buildId}}/api/json";
    var urlRegex = /\{\{(\w+)\}\}/g;

    function replaceUrlParams(url, params) {
        url.replace(urlRegex, function(match, p1) {
            return params[p1] || "";
        });
    }

    function buildInfo(nigel, params, outStream) {
        var deferred = q.defer();
        var auth = params.auth;
        var url = params.url + buildInfo;
        params.buildId = params.buildId || "lastSuccessfulBuild";
        replaceUrlParams(url, params);
        request({
            url: url.replace(url, buildNumber),
            'auth': auth
        }, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            deferred.resolve(body);
          } else if (error) {
            deferred.reject(error);
          }
        });
        return deferred.promise;
    }

    nigel.registerTask("info", "Gets a specific builds information", buildInfo);
};
