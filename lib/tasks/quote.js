var http = require('http'),
    q = require("q"),
    request = require('request');

module.exports = function (nigel, config, register) {

    //var feed = "feed://feeds.feedburner.com/brainyquote/QUOTEFU";

    function doRequest (message, outputStream) {
        var deferred = q.defer(),
            itemTag = '<item>',
            endItemTag = '</item>',
            titleTag = '<title>',
            endTitleTag = '</title>',
            textTag = '<description>',
            endTextTag = '</description>';

        request({
            url: config.url,
            httpModules: { 'feed:': http }
        }, function (error, response, body) {
            if (!error && ('' + response.statusCode).match(/^[23]\d\d$/)) {
                var item = body.substring(body.indexOf('<item>'), body.indexOf('</item>')),
                    title = item.substring(item.indexOf(titleTag) + titleTag.length, item.indexOf(endTitleTag)),
                    text = item.substring(item.indexOf(textTag) + textTag.length, item.indexOf(endTextTag));
                outputStream.end(text + ' - ' + title);
            } else {
                outputStream.end("" + error);
            }
        });
    }

    register("*", [], "Quote of the day", function (message, outputStream) {
        doRequest(message, outputStream);
    });

};