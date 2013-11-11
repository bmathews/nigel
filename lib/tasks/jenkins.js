var https = require("https");
var q = require("q");
var request = require('request');
var _ = require('lodash');

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
        params = _.extend({}, {
            buildId: "lastSuccessfulBuild",
            project: "bti-svc-integ"
        }, params);
        params.url = replaceUrlParams(params.url + projectBuildInfoUrl, params);
        request({
            url: params.url,
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
