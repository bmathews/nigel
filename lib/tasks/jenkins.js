var https = require("https");
var q = require("q");
var request = require('request');

module.exports = function (nigel) {
    var projectBuildInfoUrl = "/job/{{project}}/{{buildId}}/api/json";
    var urlRegex = /\{\{(\w+)\}\}/g;

    function replaceUrlParams(url, params) {
        return url.replace(urlRegex, function(match, p1) {
            return params[p1] || "";
        });
    }

    function buildInfo(nigel, params) {
        var deferred = q.defer();
        var auth = params.auth;
        params.buildId = params.buildId || "lastSuccessfulBuild";
        params.project = params.project || "bti-svc-integ";
        params.url = params.url;
        var url = replaceUrlParams(params.url + projectBuildInfoUrl, params);
        request({
            url: url,
            auth: {
                user: params.user,
                pass: params.pass,
                sendImmediately: true
            }
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
