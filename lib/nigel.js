var express = require('express');
var co = require('co');
var wrapper = require('co-express');
var app = wrapper(express());
var fs = require('co-fs');
var _ = require('lodash');

app.get("/nlp", function (req, res) {

});

/**
 * Find a plugin by file name in ./tasks/{{name}}
 */
function findPlugin(name) {
    console.log("\t\t./tasks/" + name + ".js");
    return require("./tasks/" + name + ".js");
}

/**
 * Creates a rest endpoint for a url, config, and a func to call
 */
function registerRestTask(url, config, func) {
    app.get(url, function (req, res) {
        func(null, _.extend({}, config, req.query)).then(function (data) {
            if (config.format !== "plain") {
                res.set('Content-Type', 'application/json');
            }
            if (req.query.callback) {
                res.jsonp(data);
            } else {
                res.send(data);
            }
        }).fail(function (err) {
            if (config.format !== "plain") {
                res.set('Content-Type', 'application/json');
            }
            if (req.query.callback) {
                res.jsonp(err);
            } else {
                res.send(err);
            }
        });
    });
}

/**
 * Registers a global plugin from config and generates rest endpoints
 */
function registerGlobal(authStore, pluginName, plugin) {
    var pluginInstance = findPlugin(plugin.plugin);
    var taskList = [];
    pluginInstance({
        registerTask: function (taskName, help, func) {
            console.log("global plugin registering: " + taskName + " @ " + pluginName + "/" + taskName);
            registerRestTask("/" + pluginName + (taskName ? "/" + taskName : ""), _.extend({}, plugin.config, authStore[pluginName]), func); 
            taskList.push({name: taskName, help: help});
        }
    });
    return taskList;
}

/**
 * Registers a project from config and generates rest endpoints
 */
function registerProject(authStore, projectName, project) {
    console.log("Discovering project: " + project.displayName + " - " + project.description); 

    var pluginList = [];

    for (var pluginName in project.plugins) {
        var pluginConfig = project.plugins[pluginName];

        var taskList = [];

        console.log("\tRegistering plugin: " + projectName + "/" + pluginName);

        var pluginInstance = findPlugin(pluginConfig.plugin);

        pluginInstance({
            registerTask: function (taskName, help, func, aliases) {
                console.log("\t\t\tplugin registering task: " + taskName + " @ " + projectName + "/" + pluginName + "/" + taskName);
                var names = [taskName];
                if (aliases) {
                    names = names.concat(aliases);
                }
                for (var i = 0; i < names.length; i++) {
                    registerRestTask("/" + projectName + "/" + pluginName + "/" + names[i], _.extend({}, pluginConfig.config, authStore[projectName][pluginName]), func);
                }
                taskList.push({name: taskName, help: help});
            }
        });

        pluginList.push({name: pluginName, tasks: taskList});
    }

    return pluginList;
}

/**
 * Takes a list of global plugins and a list of projects and generates rest endpoints for help
 */
function createGlobalHelp(globalList, projectList) {
    if (projectList && projectList.length) {
        projectList.forEach(function (project) {
            app.get("/" + project.name, function (req, res) {
                var out = "";
                if (req.query.format !== "plain") {
                    res.set('Content-Type', 'application/json');
                } else {
                    res.set("Content-Type", "application/json");
                    out = "Project: " + project.name;
                    project.plugins.forEach(function (plugin) {
                        out += "\n - Plugin: " + plugin.name;
                        plugin.tasks.forEach(function (task) {
                            out += "\n   - " + task.name;
                            out += "\n     - " + task.help;
                        });
                        out += "\n";
                    });
                }

                if (req.query.callback) {
                    res.jsonp(out || project);
                } else {
                    res.send(out || project);
                }

            });
        });
    }
    app.get("/", function (req, res) {
        var out = "";
        if (req.query.format !== "plain") {
            res.set('Content-Type', 'application/json');
        } else {
            out = "Global: \n";
            globalList.forEach(function (plugin) {
                out += "\n - Plugin: " + plugin.name;
                plugin.tasks.forEach(function (task) {
                    out += "\n   - " + task.name;
                    out += "\n     - " + task.help;
                });
            });

            out += "\n\n";
            projectList.forEach(function (project) {
                out += "Project: " + project.name + "\n";
                project.plugins.forEach(function (plugin) {
                    out += "\n - Plugin: " + plugin.name;
                    plugin.tasks.forEach(function (task) {
                        out += "\n   - " + task.name;
                        out += "\n     - " + task.help;
                    });
                    out += "\n";
                });
            });
        }

        if (req.query.callback) {
            res.jsonp(out || {global: globalList || [], projects: projectList || []});
        } else {
            res.send(out || {global: globalList || [], projects: projectList || []});
        }

    });
}



// initialize
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

    app.listen(3000);
    console.log("Listening on port 3000");
})();

