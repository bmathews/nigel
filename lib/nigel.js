var express = require('express');
var co = require('co');
var wrapper = require('co-express');
var app = wrapper(express());
var fs = require('co-fs');

app.get("/", function *(req, res) {
    res.send(yield fs.readFile("./package.json"));
});

app.listen(3000);
console.log("Listening on port 3000");