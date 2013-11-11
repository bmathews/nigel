var express = require('express');
var co = require('co');
var wrapper = require('co-express');
var app = wrapper(express());
var fs = require('co-fs');
var _ = require('lodash');

function findPlugin(name) {
    console.log("./tasks/" + name + ".js");
    return require("./tasks/" + name + ".js");
}

function registerTask(url, params, help, func) {
    app.get(url, function (req, res) {
        func(null, _.extend(params, req.query)).then(function (data) {
            res.set('Content-Type', 'application/json');
            res.send(data);
        }).fail(function (err) {
            console.log(err);
        });
    });
}

co(function *() {
    var nigelConfig = JSON.parse(yield fs.readFile("./nigel.json"));
    var auth = JSON.parse(yield fs.readFile("./auth.json"));

    if (nigelConfig.tasks) {
        var globalTasks = [];
        for (var pluginAlias in nigelConfig.tasks) {
            var localTasks = [];
            var pluginInstance = findPlugin(nigelConfig.tasks[pluginAlias].plugin);
            pluginInstance({
                registerTask: function (name, help, func) {
                    console.log("global plugin registering: " + name + " @ " + pluginAlias + "/" + name);
                    app.get("/" + pluginAlias + "/" + name, function (req, res) {
                        func(null, _.extend(auth[tasks[pluginAlias].plugin], tasks[pluginAlias].config, req.query)).then(function (data) {
                            res.set('Content-Type', 'application/json');
                            res.send(data);
                        }).fail(function (err) {
                            console.log(err);
                        });
                    });
                    localTasks.push({name: name, help: help});
                }
            });
            globalTasks.push({name: pluginAlias, tasks: localTasks});
        }
    };

    var projects = nigelConfig.projects;

    if (projects) {
        for (var projName in projects) {
            var project = projects[projName],
                tasks = project.tasks,
                projectTasks = [];

            console.log("Discovering project: " + project.name + " - " + project.description); 

            for (var pluginAlias in tasks) {
                console.log("Registering plugin: " + projName + "/" + pluginAlias);

                var pluginInstance = findPlugin(tasks[pluginAlias].plugin);
                var taskList = [];

                pluginInstance({
                    registerTask: function (name, help, func) {
                        console.log("plugin registering url: " + name + " @ " + projName + "/" + pluginAlias + "/" + name);
                        registerTask("/" + projName + "/" + pluginAlias + "/" + name, _.extend(auth[projName][tasks[pluginAlias].plugin], tasks[pluginAlias].config), help, func);
                        taskList.push({name: name, help: help});
                    }
                });

                // task list endpoint
                app.get("/" + projName + "/" + pluginAlias, function (req, res) {
                    var out = "<ul>";
                    taskList.forEach(function (task) {
                        out += "<li>" + task.name + ": " + task.help + "</li>";
                    });
                    out += "</ul>";
                    res.send(out);
                });

                projectTasks.push({name: pluginAlias, tasks: taskList});
            }

            app.get("/" + projName, function (req, res) {
                var out = "<h2>" + project.name + "</h2>"
                projectTasks.forEach(function (proj) {
                    out += "<h4>" + proj.name + "</h4>";
                    out += "<ul>";
                    proj.tasks.forEach(function (task) {
                        out += "<li>" + task.name + ": " + task.help + "</li>";
                    });
                    out += "</ul>";
                });
                res.send(out);
            });
        }
    }
})();

app.listen(3000);
console.log("Listening on port 3000");