var q = require("q");

/**
 * Auth (From cloudbees account):
 *     key_id
 *     secretKey
 */

module.exports = function (nigel, config, register) {

    function  getRandomInt (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) - min;
    }

    register("*", [], "What's for lunch?!!", function (message, outputStream) {
        if (!message.match(/(options|add|remove)/ig)) {
            outputStream.end(config.lunches[getRandomInt(0, config.lunches.length - 1)]);
        }
    });

    register("options", [], "List lunch options", function (message, outputStream) {
        outputStream.end(config.lunches.join(', '));
    });

    register("add", [], "Add a lunch option", function (message, outputStream) {
        config.lunches.push(message);
        outputStream.end("Added " + message);
    });

    register("remove", [], "Remove a lunch option", function (message, outputStream) {
        var idx = config.lunches.indexOf(message);
        if (idx >= 0) {
            config.lunches.splice(idx, 1);
            outputStream.end("Removed " + message);
        } else {
            outputStream.end("\"" + message + "\" not found.");
        }
    });
};