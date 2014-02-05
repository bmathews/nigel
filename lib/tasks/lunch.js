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
        outputStream.end(config.lunches[getRandomInt(0, config.lunches.length)]);
    });
};