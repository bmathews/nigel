var https = require("https");
var q = require("q");
var request = require('request');

JiraApi = require('jira').JiraApi;


module.exports = function (nigel) {
    function listProjectIssues(nigel, params, outStream) {
        var deferred = q.defer();
        var query = "project=" + params.project

       var jira = new JiraApi('https', params.host, params.port, params.user, params.pass, '2', true);

        jira.searchJira(query, null, function (error, res) {
            if (!error) {
                deferred.resolve(res);
            } else {
                deferred.reject(error);
            }
        });
        return deferred.promise;
    }

    nigel.registerTask("list", "List project issues", listProjectIssues);
};
