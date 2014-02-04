// create http protocol
var HTTP = require('./lib/protocols/http');
var h = new HTTP(process.env.PORT || 3001);

// create xmpp protocol
var XMPP = require('./lib/protocols/xmpp');
var x = new XMPP({
    jid: 'user@gmail.com',
    password: 'pw',
    host: 'talk.google.com',
    port: 5222
});

// create nigel
var Nigel = require("./lib/nigel");
var n = new Nigel({
    protocols: [h,x]
});