var q = require("q");

/**
 * Auth (From cloudbees account):
 *     key_id
 *     secretKey
 */

module.exports = function (nigel, config, register) {
    var possibleHands = ['rock', 'paper', 'scissors'],
        tieMessages = [
            'Tied..',
            'I win by default!'
        ],
        winMessages = [
            'You won..',
            'Wat. :|',
            'Let\'s go again.',
            'Whatevs..'
        ],
        loseMessages = [
            'I win!',
            'hah. :P',
            'Sucker',
            'C\'mon, I dare you to try again.',
            'I AM NIGEL!'
        ];

    function  getRandomInt (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) - min;
    }

    function getNigelHand () {
        return possibleHands[getRandomInt(0, possibleHands.length - 1)];
    }

    function getTieResult () {
        return tieMessages[getRandomInt(0, tieMessages.length - 1)];
    }

    function getTieResult () {
        return tieMessages[getRandomInt(0, tieMessages.length - 1)];
    }

    function getTieResult () {
        return tieMessages[getRandomInt(0, tieMessages.length - 1)];
    }

    function play (userHand, outputStream) {
        var nigelHand = getNigelHand(),
            result = '';
        if (userHand === nigelHand) {
            result = tieMessages[getRandomInt(0, tieMessages.length - 1)];
        } else if (userHand === 'rock' && nigelHand === 'paper' ||
                userHand === 'paper' && nigelHand === 'scissors' ||
                userHand === 'scissors' && nigelHand === 'rock') {
            result = loseMessages[getRandomInt(0, loseMessages.length - 1)];
        } else {
            result = winMessages[getRandomInt(0, winMessages.length - 1)];
        }

        outputStream.end(nigelHand + '\n\n' + result);
    }


    register("*", [], "Play rock", function (message, outputStream) {
        if (message === 'rock' || message === 'paper' || message === 'scissors') {
            play(message, outputStream);
        } else {
            outputStream.end("I don't understand!");
        }
    });


};