var express = require('express');
var co = require('co');
var wrapper = require('co-express');
var app = wrapper(express());
var fs = require('co-fs');

function findPlugin(name) {
    console.log("./tasks/" + name + ".js");
    return require("./tasks/" + name + ".js");
}

co(function *() {
    var nigelConfig = JSON.parse(yield fs.readFile("./nigel.json"));

    var projects = nigelConfig.projects;

    if (projects) {
        for (var projName in projects) {
            var project = projects[projName],
                tasks = project.tasks;

            console.log("Discovering project: " + project.name + " - " + project.description); 

            for (var pluginAlias in tasks) {
                console.log("Registering plugin: " + projName + "/" + pluginAlias);

                var pluginInstance = findPlugin(tasks[pluginAlias].plugin);

                pluginInstance({
                    registerTask: function (name, help, func) {
                        console.log("plugin registering: " + name);
                    }
                });

            }
        }
    }
})();

app.listen(3000);
console.log("Listening on port 3000");