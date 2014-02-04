var express = require('express'),
    fs = require('fs'),
    _ = require('lodash');

function Nigel(config) {
    var projectList = this.projectList = [];
    var globalList = this.globalList = [];
    var self = this;

    protocols = config.protocols.join ? config.protocols : [config.protocols];

    // get config objects
    var nigelConfig = JSON.parse(fs.readFileSync("./nigel.json"));
    var authStore = JSON.parse(fs.readFileSync("./auth.json"));

    // read projects
    if (nigelConfig.projects) {
        for (var projName in nigelConfig.projects) {
            var pluginList = registerProject(authStore[projName], projName, nigelConfig.projects[projName], protocols);
            projectList.push({name: projName, plugins: pluginList});
        }
    }

    // read global plugins
    if (nigelConfig.plugins) {
        for (var pluginName in nigelConfig.plugins) {
            var taskList = registerPlugin(authStore[pluginName], pluginName, nigelConfig.plugins[pluginName], protocols);
            globalList.push({name: pluginName, tasks: taskList});
        }
    }

    // register a plugin at a namespace
    function registerPlugin(authStore, namespace, pluginDescriptor, protocols) {
        var pluginInstance = findPlugin(pluginDescriptor.plugin),
            config = _.extend({}, pluginDescriptor.config, authStore),
            taskList = [];

        namespace = namespace.join ? namespace : [namespace];

        pluginInstance(self, config, function (taskName, aliases, help, func) {
            protocols.forEach(function (protocol) {
                var nsClone = namespace.slice(0);
                if (taskName !== "*") {
                    nsClone.push(taskName);
                }
                protocol.registerTask(nsClone, func);
            });
            taskList.push({name: taskName, help: help});
        });
        return taskList;
    }


    // register a project and it's subsequent plugins
    function registerProject(authStore, projectName, projectDescriptor, protocols) {
        var pluginList = [];

        for (var pluginName in projectDescriptor.plugins) {
            var pluginDescriptor = projectDescriptor.plugins[pluginName];
            var taskList = registerPlugin(authStore ? authStore[pluginName] : undefined, [projectName, pluginName], pluginDescriptor, protocols);
            pluginList.push({name: pluginName, tasks: taskList});
        }
        return pluginList;
    }
}

module.exports = Nigel;

// find plugin by name
function findPlugin(name) {
    return require("./tasks/" + name + ".js");
}
