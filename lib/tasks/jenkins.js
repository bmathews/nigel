var https = require("https");
var q = require("q");
var request = require('request');
var _ = require('lodash');

module.exports = function (nigel) {
    var projectBuildInfoUrl = "/job/{{project}}/{{buildId}}/api/json";
    var projectBuildStartUrl = "/job/{{project}}/build";

    var urlRegex = /\{\{(\w+)\}\}/g;

    function replaceUrlParams(url, params) {
        return url.replace(urlRegex, function(match, p1) {
            return params[p1] || "";
        });
    }

    function doRequest(params, method) {
        var deferred = q.defer();
        request({
            url: params.url,
            method: method || "GET",
            auth: {
                user: params.user,
                pass: params.pass,
                sendImmediately: true
            }
        }, function (error, response, body) {
            console.log(response);
          if (('' + response.statusCode).match(/^[23]\d\d$/)) {
            deferred.resolve(body);
          } else {
            deferred.reject(error);
          }
        });
        return deferred.promise;
    }

    function buildInfo(nigel, params) {
        params = _.extend({}, {
            buildId: "lastBuild",
            project: "bti-svc-integ"
        }, params);
        params.url = replaceUrlParams(params.url + projectBuildInfoUrl, params);
        return doRequest(params);
    }

    function startBuild(nigel, params) {
        params = _.extend({}, {
            project: "bti-svc-integ"
        }, params);
        params.url = replaceUrlParams(params.url + projectBuildStartUrl, params);
        return doRequest(params, "POST").then(function() {
            return buildInfo(nigel, params);
        });
    }

    nigel.registerTask("info", "Gets a specific builds information", buildInfo);
    nigel.registerTask("start", "Starts a new build", startBuild);
};
