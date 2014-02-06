var express = require('express'),
    fs = require('fs'),
    _ = require('lodash'),
    md5 = require('MD5'),
    NigelAuth = require('./nigelAuth');

// todo: think about an api that doesn't require a config file
// ie.  nigel.addPlugin, nigel.addProtocol...
function Nigel() {
    var projectList = this.projectList = [];
    var globalList = this.globalList = [];
    var self = this;
    var app = this.server = express();
    var port = process.env.PORT || 3001;
    var protocols = [];
    var sessions = {};

    // get config objects
    var nigelConfig = this.config = JSON.parse(fs.readFileSync("./nigel.json"));
    var authStore = JSON.parse(fs.readFileSync("./auth.json"));

    app.use(express.bodyParser());
    app.use(express.cookieParser() );
    app.use(express.session({ secret: md5("atsnigelchatbotz" + nigelConfig.uniqueKey) }));
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');

    this.auth = new NigelAuth(this);

    if (nigelConfig.protocols) {
        for (var protocolName in nigelConfig.protocols) {
            var protocolConf = nigelConfig.protocols[protocolName];
            protocols.push(new (findProtocol(protocolConf.path))(protocolConf.config || {}));
        }
    }
    // protocols = config.protocols.join ? config.protocols : [config.protocols];

    // read projects
    if (nigelConfig.projects) {
        for (var projName in nigelConfig.projects) {
            var pluginList = registerProject(projName, nigelConfig.projects[projName], protocols);
            projectList.push({name: projName, plugins: pluginList});
        }
    }

    // read global plugins
    if (nigelConfig.plugins) {
        for (var pluginName in nigelConfig.plugins) {
            var taskList = registerPlugin(pluginName, nigelConfig.plugins[pluginName], protocols);
            globalList.push({name: pluginName, tasks: taskList});
        }
    }

    // register a plugin at a namespace
    function registerPlugin(namespace, pluginDescriptor, protocols) {
        var pluginInstance = findPlugin(pluginDescriptor.path),
            config = _.extend({}, pluginDescriptor.config),
            taskList = [],
            authConfig = pluginDescriptor.auth;

        namespace = namespace.join ? namespace : [namespace];

        pluginInstance(self, config, function (taskName, aliases, help, func) {
            protocols.forEach(function (protocol) {
                var nsClone = namespace.slice(0);
                if (taskName !== "*") {
                    nsClone.push(taskName);
                }
                protocol.registerTask(nsClone, function(message, outputStream, session) {
                    var args = Array.prototype.slice.call(arguments, 0);
                    var runConfig = {
                        session: session
                    };
                    if (authConfig) {
                        var uniqueAuthKey = authConfig.id ? authConfig.id : pluginDescriptor.path + (config.url ? config.url : "");
                        self.auth.get(uniqueAuthKey, authConfig.type, session).then(function(auth) {
                            runConfig.auth = auth;
                            return func.call(this, message, outputStream, runConfig);
                        }, function(err) {
                            if (err.type === "FILL_CREDENTIALS") {
                                outputStream.end("Please go to " + err.data.url + " to setup credentials for " + taskName);
                            } else {
                                outputStream.end(err.message);
                            }
                        });
                    } else {
                        return func.call(this, message, outputStream, runConfig);
                    }
                }, self);
            });
            taskList.push({name: taskName, help: help});
        });
        return taskList;
    }


    // register a project and it's subsequent plugins
    function registerProject(projectName, projectDescriptor, protocols) {
        var pluginList = [];

        for (var pluginName in projectDescriptor.plugins) {
            var pluginDescriptor = projectDescriptor.plugins[pluginName];
            var taskList = registerPlugin([projectName, pluginName], pluginDescriptor, protocols);
            pluginList.push({name: pluginName, tasks: taskList});
        }
        return pluginList;
    }

    /**
     * Starts a new nigel session from some given id
     * @param  {[type]} someId [description]
     * @return {[type]}        [description]
     */
    this.startSession = function (someId) {
        var session = this.findSession(someId);
        var sessionId;
        if (session) {
            return session;
        } else {
            sessionId = md5(someId);
            return sessions[sessionId] = {
                id: sessionId
            };
        }
    };

    this.endSession = function (session) {
        delete sessions[session.id];
    };

    this.findSession = function (someId) {
        return sessions[md5(someId)];
    };

    console.log("HTTP: listening on port: %s", port);
    app.listen(port);
}

module.exports = Nigel;

function findProtocol(name) {
    return require('./protocols/' + name + ".js");
}

// find plugin by name
function findPlugin(name) {
    return require("./tasks/" + name + ".js");
}