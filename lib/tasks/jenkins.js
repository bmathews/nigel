var https = require("https");
var q = require("q");
var request = require('request');
var _ = require('lodash');

module.exports = function (nigel) {
    var projectBuildInfoUrl = "/job/{{project}}/{{buildId}}";
    var projectBuildInfoJsonUrl = projectBuildInfoUrl + "/api/json";
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
        params.url = replaceUrlParams(params.url + projectBuildInfoJsonUrl, params);
        return doRequest(params).then(function(resp) {
            if (params.format === "plain") {
                var body = JSON.parse(resp);
                var result = "";
                var changeItems = body.changeSet.items;
                for (var i = 0; i < changeItems.length; i++) {
                    var line = changeItems[i].msg + " - " + changeItems[i].author.fullName;
                    result += line + "\n";
                }
                result += "Status: " + body.result + "\n";
                result += "Url: " + body.url;
                return result;
            }
            return resp;
        });
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
                var result = { build: jsonObj.nextBuildNumber };
                if (params.format === "plain") {
                    result =
                        "Started build " + jsonObj.nextBuildNumber + " - " +
                        replaceUrlParams(oParams.url + projectBuildInfoUrl, {
                            project: oParams.project,
                            buildId: jsonObj.nextBuildNumber
                        });
                }
                deferred.resolve(result);
            }, deferred.reject);
        }, deferred.reject);
        return deferred.promise;
    }

    nigel.registerTask("info", "Gets a specific builds information", buildInfo);
    nigel.registerTask("start", "Starts a new build", startBuild);
};
