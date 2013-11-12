var express = require('express');
var co = require('co');
var wrapper = require('co-express');
var app = wrapper(express());
var fs = require('co-fs');
var _ = require('lodash');

function findPlugin(name) {
    console.log("\t\t./tasks/" + name + ".js");
    return require("./tasks/" + name + ".js");
}

function registerRestTask(url, config, func) {
    app.get(url, function (req, res) {
        func(null, _.extend(config, req.query)).then(function (data) {
            res.set('Content-Type', 'application/json');
            res.send(data);
        }).fail(function (err) {
            console.log(err);
        });
    });
}

function registerGlobal(authStore, pluginName, plugin) {
    var pluginInstance = findPlugin(plugin.plugin);
    var taskList = [];
    pluginInstance({
        registerTask: function (taskName, help, func) {
            console.log("global plugin registering: " + taskName + " @ " + pluginName + "/" + taskName);
            registerRestTask("/" + pluginName + "/" + taskName, _.extend(plugin.config, authStore[pluginName]), func); 
            taskList.push({name: taskName, help: help});
        }
    });
    return taskList;
}

function registerProject(authStore, projectName, project) {
    console.log("Discovering project: " + project.displayName + " - " + project.description); 

    var pluginList = [];

    for (var pluginName in project.plugins) {
        var pluginConfig = project.plugins[pluginName];

        var taskList = [];

        console.log("\tRegistering plugin: " + projectName + "/" + pluginName);

        var pluginInstance = findPlugin(pluginConfig.plugin);

        pluginInstance({
            registerTask: function (taskName, help, func) {
                console.log("\t\t\tplugin registering task: " + taskName + " @ " + projectName + "/" + pluginName + "/" + taskName);
                registerRestTask("/" + projectName + "/" + pluginName + "/" + taskName, _.extend(pluginConfig.config, authStore[projectName][pluginName]), func);
                taskList.push({name: taskName, help: help});
            }
        });

        pluginList.push({name: pluginName, tasks: taskList});
    }

    return pluginList;
}

function createGlobalHelp(globalList, projectList) {
    globalOut = "<h1>Global</h1>";
    if (globalList && globalList.length) {

    }
    globalOut += "<hr>";
    globalOut += "<h1>Projects</h1>";
    if (projectList && projectList.length) {
        projectList.forEach(function (project) {
            var projectOut = "";
            projectOut += "<h3>"+ project.name +"</h3>";
            project.plugins.forEach(function (plugin) {
                var pluginOut = "";
                pluginOut += "<h5>"+ plugin.name +"</h5>";
                pluginOut += "<ul>";
                plugin.tasks.forEach(function (task) {
                    pluginOut += "<li>"+ task.name + ": " + task.help + "</li>"
                })
                pluginOut += "</ul>";
                app.get("/" + project.name + "/" + plugin.name, function (req, res) {
                    res.send(pluginOut);
                });
                projectOut += pluginOut;
            });

            app.get("/" + project.name, function (req, res) {
                res.send(projectOut);
            });
            globalOut += projectOut;
        });

        app.get("/", function (req, res) {
            res.send(globalOut);
        });
    }
}

co(function *() {
    var nigelConfig = JSON.parse(yield fs.readFile("./nigel.json"));
    var authStore = JSON.parse(yield fs.readFile("./auth.json"));

    
    var projectList = [];
    var globalList = [];

    if (nigelConfig.projects) {
        var projects = nigelConfig.projects;
        for (var projName in projects) {
            var pluginList = registerProject(authStore, projName, projects[projName]);
            projectList.push({name: projName, plugins: pluginList});
        }
    }

    if (nigelConfig.plugins) {
        for (var pluginAlias in nigelConfig.plugins) {
            var taskList = registerGlobal(authStore, pluginAlias, nigelConfig.plugins[pluginAlias]);
            globalList.push({name: pluginAlias, tasks: taskList});
        }
    }

    createGlobalHelp(globalList, projectList);
})();

app.listen(3000);
console.log("Listening on port 3000");