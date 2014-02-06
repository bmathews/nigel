var https = require("https");
var q = require("q");
var request = require('request');

module.exports = function (nigel, config, register) {
    var searchUrl = "rest/prototype/1/search.json";
    var spaceUrl = "rest/prototype/1/space";
    var contentUrl = "rest/prototype/1/content";

    function search(message, outputStream, session) {
        var url = config.url + searchUrl;
        nigel.auth.get("confluence", session).then(function(auth) {
            request({
                url: url,
                json: true,
                auth: auth,
                qs: {
                    query: message,
                    spaceKey: config.spaceKey || ""
                }
            }, function (error, response, body) {
                if (response.statusCode == 200) {
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
                    console.log(out);
                    outputStream.end(out);
                } else {
                    outputStream.end(error || body);
                }
            });

        }, function (err) {
            outputStream.end(err.message);
        });
    }

    // function space(message, outputStream) {
    //     var deferred = q.defer();
    //     var url = config.url + spaceUrl + (params.space ? "/" + params.space : params.spaceKey ? "/" + params.spaceKey : "") + ".json";
    //     request({
    //         json: true,
    //         url: url,
    //         auth: {
    //             user: config.user,
    //             pass: config.pass
    //         }
    //     }, function (error, response, body) {
    //         if (response.statusCode == 200) {
    //             deferred.resolve(body);
    //         } else {
    //             deferred.reject(error || body);
    //         }
    //     });
    //     return deferred.promise;
    // }

    // function readme(message, outputStream) {
    //     var url = config.url + spaceUrl + (params.space ? "/" + params.space : params.spaceKey ? "/" + params.spaceKey : "") + ".json";
    //     var deferred = q.defer();
    //     request({
    //         json: true,
    //         url: url,
    //         auth: {
    //             user: config.user,
    //             pass: config.pass
    //         }
    //     }, function (error, response, body) {
    //         request({
    //             json: true,
    //             url: config.url + contentUrl + "/" + body.home.id + ".json",
    //             auth: {
    //                 user: config.user,
    //                 pass: config.pass
    //             }
    //         }, function (error, response, body) {
    //             deferred.resolve("<!doctype html><html><head></head><body>" + body.body.value + "</body></html>");
    //         });
    //     });
    //     return deferred.promise;
    // }

    register("search", [], "Searches confluence with [query]", search);
    // register("space", [], "Loads default space or [space]", space);
    // register("readme", [], "Loads readme text", readme);
};
