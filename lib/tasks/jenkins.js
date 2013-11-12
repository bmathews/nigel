var https = require("https");
var q = require("q");
var request = require('request');
var _ = require('lodash');

module.exports = function (nigel) {
    var projectBuildInfoUrl = "/job/{{project}}/{{buildId}}/api/json";
    var projectBuildStartUrl = "/job/{{project}}/build";
    var projectInfoUrl = "/job/{{project}}/api/json";

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
          if (('' + response.statusCode).match(/^[23]\d\d$/)) {
            deferred.resolve(body);
          } else {
            deferred.reject(error || body);
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

    function getProjectInfoParams(params) {
        var oParams = _.extend({}, params);
        oParams = _.extend({}, {
            project: "bti-svc-integ"
        }, oParams);
        oParams.url = replaceUrlParams(oParams.url + projectInfoUrl, oParams);
        return oParams;
    }

    function projectInfo(nigel, params) {
        return doRequest(getProjectInfoParams(params));
    }

    function startBuild(nigel, params) {
        var deferred = q.defer();
        var oParams = _.extend({}, params);
        params = _.extend({}, {
            project: "bti-svc-integ"
        }, params);
        params.url = replaceUrlParams(params.url + projectBuildStartUrl, params);
        doRequest(params, "POST").then(function() {
            doRequest(getProjectInfoParams(oParams)).then(function (data) {
                var jsonObj = JSON.parse(data);
                deferred.resolve({ build: jsonObj.nextBuildNumber });
            }, deferred.reject);
        }, deferred.reject);
        return deferred.promise;
    }

    nigel.registerTask("info", "Gets a specific builds information", buildInfo);
    nigel.registerTask("start", "Starts a new build", startBuild);
};
