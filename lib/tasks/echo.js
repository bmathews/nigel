module.exports = function (nigel, config, register) {
    register("*", ['herp'], "Echos your message!", function (message, outputStream) {
        outputStream.write("Echo: " + message);
        outputStream.end();
    });
};