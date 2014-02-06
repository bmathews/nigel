var express = require('express'),
    fs = require('fs'),
    _ = require('lodash'),
    md5 = require('MD5'),
    q = require("q");

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

    app.use(express.bodyParser());
    app.use(express.cookieParser() );
    app.use(express.session({ secret: "atsnigelchatbotz" }));
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');

    this.auth = new NigelAuth(this);

    // get config objects
    var nigelConfig = JSON.parse(fs.readFileSync("./nigel.json"));
    var authStore = JSON.parse(fs.readFileSync("./auth.json"));
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
                        var uniqueAuthKey = authConfig.key ? authConfig.key : pluginDescriptor.path + (config.url ? config.url : "");
                        self.auth.get(uniqueAuthKey, authConfig.type, session).then(function(auth) {
                            runConfig.auth = auth;
                            return func.call(this, message, outputStream, runConfig);
                        }, function(err) {
                            if (err.type === "AUTH") {
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

// TODO: Temporary
function NigelAuth(nigel) {
    var credentials = {};
    var tokens = {};
    var seed = Math.random() * 200000000;
    var self = this;

    this.generateToken = function(key, type, session, meta) {
        for (var token in tokens) {
            var tokenData = tokens[token];
            if (tokenData.key == key && tokenData.session == session) {
                delete tokens[token];
                break;
            }
        }
        var newToken = md5(new Date().getTime() + seed);
        tokens[newToken] = { key: key, type: type, session: session, meta: meta };
        return newToken;
    };

    this.validToken = function (tokenId) {
        return !!tokens[tokenId];
    };

    this.get = function (key, type, session) {
        var result = q.defer();
        if (!credentials[key + "_" + session.id]) {
            var token = self.generateToken(key, type, session);
            result.reject({
                type: "AUTH", //
                data: {
                    url: "http://localhost:3001/auth?tId=" + token
                }
            });
        } else {
            result.resolve(credentials[key + "_" + session.id]);
        }
        return result.promise;
    };

    this.setFromToken = function (token, value) {
        if (this.validToken(token)) {
            var tokenData = tokens[token];
            if (tokenData) {
                self.set(tokenData.key, tokenData.type, tokenData.session, value);
                delete tokens[token];
            }
        }
    };

    this.set = function (key, type, session, value) {
        credentials[key + "_" + session.id] = value;
    };

    nigel.server.get('/auth', function (req, res) {
        if (req.query.tId && self.validToken(req.query.tId)) {
            var tokenData = tokens[req.query.tId];
            res.render(tokenData.type, {
                title: tokenData.key,
                tId: req.query.tId
            });
        } else {
            res.end("Invalid!");
        }
    });

    nigel.server.post('/auth', function (req, res) {
        if (req.query.tId && self.validToken(req.query.tId)) {
            self.setFromToken(req.query.tId, {
                user: req.body.user,
                pass: req.body.pass
            });
            res.end("Updated Credentials");
        } else {
            res.end("Invalid!");
        }
    });
}
