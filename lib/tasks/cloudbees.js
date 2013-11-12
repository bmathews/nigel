var _ = require('lodash'),
    md5 = require('md5'),
    q = require("q"),
    request = require('request');
    //xml2json = require('xml2json');

/**
 * Auth (From cloudbees account):
 *     key_id
 *     secretKey
 */

module.exports = function (nigel) {
    var config = {
            v: '0.1',
            sig_version: '1',
            format: 'json'
        };

    function doRequest (action, params, formatter, method, payload) {
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
            var secretKey = params.secretKey;
            params.timestamp = Math.round(new Date().getTime() / 1000);
            params.action = action;

            var paramNames = Object.keys(config).concat(Object.keys(params)).sort(),
                paramString = '',
                sig = '';

            paramNames.forEach(function (paramName) {
                var value = config[paramName] || params[paramName];
                if (paramName !== 'secretKey') {
                    paramString += paramName + '=' + value + '&';
                    sig += paramName + value;
                }
            });

            sig = md5(sig + secretKey);
            paramString += 'sig=' + sig;
            return '?' + paramString;
        }

        /**
         * Creates the request for the action.
         * @param  {Function} callback
         * @return {Object} request
         */
        request({
            url: params.url + getParams(),
            method: method || "GET"
        }, function (error, response, body) {
            if (('' + response.statusCode).match(/^[23]\d\d$/)) {
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
    nigel.registerTask("app/list", "Gets a the list of apps.", function (nigel, params) {
        return doRequest('application.list', params, function (results) {
            if (params.format === "plain") {
                return listPlainFormatter('Applications', JSON.parse(results).ApplicationListResponse.applications, 'title', ['status', 'url']);
            }

            return results;
        });
    });

    /**
     * Gets info for a single app.
     * params:
     *     app_id
     */
    nigel.registerTask("app/info", "Gets meta information of an app.", function (nigel, params) {
        return doRequest('application.info', params, function (results) {
            if (params.format === "plain") {
                return plainFormatter(JSON.parse(results).ApplicationInfoResponse.application);
            }

            return results;
        });
    });

    // nigel.registerTask("app/stop", "Gets a the list of applications.", function (nigel, params) {
    //     return doRequest('application.stop', params);
    // });

    // nigel.registerTask("app/start", "Starts an app.", function (nigel, params) {
    //     return doRequest('application.start', params);
    // });

    nigel.registerTask("app/restart", "Restarts an app.", function (nigel, params) {
        return doRequest('application.restart', params, function (results) {
            if (params.format === "plain") {
                var results = JSON.parse(results);
                return (results.ApplicationRestartResponse.restarted) ? 'App was restarted.' : 'Failed to restart the app.';
            }

            return results;
        });
    });

    nigel.registerTask("database/list", "Gets a the list of apps.", function (nigel, params) {
        return doRequest('database.list', params, function (results) {
            if (params.format === "plain") {
                return listPlainFormatter('Applications', JSON.parse(results).DatabaseListResponse.databases, 'name', ['status', 'owner', 'username', 'master']);
            }

            return results;
        });
    });

    /**
     * Gets info for a single app.
     * params:
     *     database_id
     */
    nigel.registerTask("database/info", "Gets meta information of an app.", function (nigel, params) {
        return doRequest('database.info', params, function (results) {
            if (params.format === "plain") {
                return plainFormatter(JSON.parse(results).DatabaseInfoResponse.database);
            }

            return results;
        });
    });
};