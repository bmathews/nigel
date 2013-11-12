var http = require('http'),
    q = require("q"),
    request = require('request');

/**
 * Auth (From cloudbees account):
 *     key_id
 *     secretKey
 */

module.exports = function (nigel) {

    //var feed = "feed://feeds.feedburner.com/brainyquote/QUOTEFU";

    function doRequest (params) {
        var deferred = q.defer(),
            itemTag = '<item>',
            endItemTag = '</item>',
            titleTag = '<title>',
            endTitleTag = '</title>',
            textTag = '<description>',
            endTextTag = '</description>';

        request({
            url: params.url,
            httpModules: { 'feed:': http }
        }, function (error, response, body) {
            var item = body.substring(body.indexOf('<item>'), body.indexOf('</item>')),
                title = item.substring(item.indexOf(titleTag) + titleTag.length, item.indexOf(endTitleTag)),
                text = item.substring(item.indexOf(textTag) + textTag.length, item.indexOf(endTextTag));

            if (('' + response.statusCode).match(/^[23]\d\d$/)) {
                if (params.format === 'plain') {
                    deferred.resolve(text + ' - ' + title);
                } else {
                    deferred.resolve({
                        title: title,
                        text: text
                    });
                }
            } else {
                deferred.reject(error);
            }
        });

        return deferred.promise;
    }

    nigel.registerTask("today", "Quote of the day", function (nigel, params) {
        return doRequest(params);
    });

};