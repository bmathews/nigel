var https = require("https");
var q = require("q");
var request = require('request');

module.exports = function (nigel) {
    var searchUrl = "rest/prototype/1/search.json";
    var spaceUrl = "rest/prototype/1/space";
    var contentUrl = "rest/prototype/1/content";

    function search(nigel, params, outStream) {
        var deferred = q.defer();
        var url = params.url + searchUrl;

        request({
            url: url,
            json: true,
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
                if (params.format === "plain") {
                    var out = "";
                    if (body.result) {
                        body.result.forEach(function (result) {
                            out += "Type: " + result.type;
                            out += "\nTitle: " + result.title;
                            result.link.forEach(function (link) {
                                if (link.rel === "alternate" && link.type === "text/html") {
                                    out += "\nLink: " + link.href;
                                }
                            });
                            out += "\n\n";
                        });
                    } else {
                        out += "No results";
                    }
                    deferred.resolve(out);
                } else {
                    deferred.resolve(body);
                }
            } else {
                deferred.reject(error || body);
            }
        });
        return deferred.promise;
    }

    function space(nigel, params) {
        var deferred = q.defer();
        var url = params.url + spaceUrl + (params.space ? "/" + params.space : params.spaceKey ? "/" + params.spaceKey : "") + ".json";
        request({
            json: true,
            url: url,
            auth: {
                user: params.user,
                pass: params.pass
            }
        }, function (error, response, body) {
            if (response.statusCode == 200) {
                deferred.resolve(body);
            } else {
                deferred.reject(error || body);
            }
        });
        return deferred.promise;
    }

    function readme(nigel, params) {
        var url = params.url + spaceUrl + (params.space ? "/" + params.space : params.spaceKey ? "/" + params.spaceKey : "") + ".json";
        var deferred = q.defer();
        request({
            json: true,
            url: url,
            auth: {
                user: params.user,
                pass: params.pass
            }
        }, function (error, response, body) {
            request({
                json: true,
                url: params.url + contentUrl + "/" + body.home.id + ".json",
                auth: {
                    user: params.user,
                    pass: params.pass
                }
            }, function (error, response, body) {
                deferred.resolve("<!doctype html><html><head></head><body>" + body.body.value + "</body></html>");
            });
        });
        return deferred.promise;
    }

    nigel.registerTask("search", "Searches confluence with [query]", search);
    nigel.registerTask("space", "Loads default space or [space]", space);
    nigel.registerTask("readme", "Loads readme text", readme);
};
