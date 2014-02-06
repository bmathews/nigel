var _ = require('lodash'),
    md5 = require('MD5'),
    q = require("q"),
    request = require('request');
    //xml2json = require('xml2json');

/**
 * Auth (From cloudbees account):
 *     key_id
 *     secretKey
 */

module.exports = function (nigel, config, register) {
    var reqConfig = {
            v: '0.1',
            sig_version: '1',
            format: 'json'
        };

    function doRequest (action, params, auth, formatter, method, payload) {
        var deferred = q.defer();

        /**
         * Signs the URL for use by cloudbeee:
         * 1.  Get all params, sort by name,
         * 2.  Concat name with value
         * 3.  Concat all pairs togethr
         * 4.  md5 string with API secret
         * @param  {Object} urlObj
         */
        function getParams () {
            var opts = _.extend({}, params, auth);
            opts.timestamp = Math.round(new Date().getTime() / 1000);
            opts.action = action;

            var paramNames = Object.keys(reqConfig).concat(Object.keys(opts)).sort(),
                paramString = '',
                sig = '';

            paramNames.forEach(function (paramName) {
                var value = reqConfig[paramName] || opts[paramName];
                if (paramName !== 'secretKey') {
                    paramString += paramName + '=' + value + '&';
                    sig += paramName + value;
                }
            });

            sig = md5(sig + auth.secretKey);
            paramString += 'sig=' + sig;
            return '?' + paramString;
        }

        /**
         * Creates the request for the action.
         * @param  {Function} callback
         * @return {Object} request
         */
        request({
            url: config.url + getParams(),
            method: method || "GET"
        }, function (error, response, body) {
            if (!error && ('' + response.statusCode).match(/^[23]\d\d$/)) {
                if (formatter) {
                    body = formatter(body);
                    deferred.resolve(body);
                } else {
                    deferred.resolve(body);
                }
            } else {
                deferred.reject(error);
            }
        });

        // if (payload) {
        //     request.write(payload);
        // }

        return deferred.promise;
    }

    function plainFormatter (item, fields) {
        var plainResult = '';
        fields = fields || Object.keys(item || {});
        fields.forEach(function (field) {
            plainResult += '\n  ' + field + ': ' + item[field];
        });
        return plainResult;
    }

    function listPlainFormatter (type, items, name, fields) {
        var plainResult = type + ":";
        if (items.length) {
            items.forEach(function (item) {
                plainResult += '\n\n' + item[name] + plainFormatter(item, fields);
            });
        } else {
            plainResult += '  none';
        }

        return plainResult;
    }

    /**
     * Get all apps
     */
    register("app list", [], "Gets a the list of apps.", function (message, outputStream, runConfig) {
        doRequest('application.list', config, runConfig.auth, function (results) {
            return listPlainFormatter('Applications', JSON.parse(results).ApplicationListResponse.applications, 'title', ['status', 'url']);
        }).then(function (res) {
            outputStream.end(res);
        });
    });

    /**
     * Gets info for a single app.
     * params:
     *     app_id
     */
    // register("app info", [], "Gets meta information of an app.", function (message, outputStream) {
    //     doRequest('application.info', config, function (results) {
    //         return plainFormatter(JSON.parse(results).ApplicationInfoResponse.application);
    //     }).then(function (res) {
    //         outputStream.end(res);
    //     });
    // });

    // register("app stop", [], "Gets a the list of applications.", function (message, outputStream) {
    //     doRequest('application.stop', params);
    // });

    // register("app start", [], "Starts an app.", function (message, outputStream) {
    //     doRequest('application.start', params);
    // });

    // register("app restart", [], "Restarts an app.", function (message, outputStream) {
    //     doRequest('application.restart', config, function (results) {
    //         return (results.ApplicationRestartResponse.restarted) ? 'App was restarted.' : 'Failed to restart the app.';
    //     }).then(function (res) {
    //         outputStream.end(res);
    //     });
    // });

    register("database list", [], "Gets a the list of apps.", function (message, outputStream, runConfig) {
        doRequest('database.list', config, runConfig.auth, function (results) {
            return listPlainFormatter('Databases', JSON.parse(results).DatabaseListResponse.databases, 'name', ['status', 'owner', 'username', 'master']);
        }).then(function (res) {
            outputStream.end(res);
        });
    });

    /**
     * Gets info for a single app.
     * params:
     *     database_id
     */
    // register("database info", [], "Gets meta information of an app.", function (message, outputStream) {
    //     doRequest('database.info', config, function (results) {
    //         return plainFormatter(JSON.parse(results).DatabaseInfoResponse.database);
    //     }).then(function (res) {
    //         outputStream.end(res);
    //     });
    // });
};