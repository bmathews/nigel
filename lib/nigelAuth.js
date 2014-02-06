var md5 = require('MD5'),
    q = require("q"),
    crypto = require('crypto');

// TODO: Temporary
/**
 * Provides very primitive authentication storage
 * @param {[type]} nigel [description]
 */
function NigelAuth(nigel) {
    var tokens = {};
    var seed = Math.random() * 200000000;
    var self = this;
    var sqlite3 = require('sqlite3').verbose();
    var db;

    /**
     * Closes the current database
     * @return {[type]} [description]
     */
    function closeDb() {
        if (db) {
            db.close();
            db = null;
        }
    }

    /**
     * Initializes a new database
     * @return {[type]} [description]
     */
    function initDb() {
        closeDb();
        db = new sqlite3.Database(':memory:');
        db.serialize(function() {
            db.run("CREATE TABLE user_creds (key TEXT, value TEXT)");
        });
    }

    /**
     * Encrypts the given data using the given values
     * @param  {[type]} dataId  [description]
     * @param  {[type]} session [description]
     * @param  {[type]} data    [description]
     * @return {[type]}         [description]
     */
    function encryptData(dataId, session, data) {
        var cipher = crypto.createCipher('aes-256-cbc', dataId + "_" + session.id + "_" + nigel.config.uniqueKey);
        var text = data;
        var crypted = cipher.update(text,'utf8','hex');
        crypted += cipher.final('hex');
        return crypted;
    }

    /**
     * Decrypts the given data using the given values
     * @param  {[type]} dataId  [description]
     * @param  {[type]} session [description]
     * @param  {[type]} data    [description]
     * @return {[type]}         [description]
     */
    function decryptData(dataId, session, data) {
        var decipher = crypto.createDecipher('aes-256-cbc', dataId + "_" + session.id + "_" + nigel.config.uniqueKey);
        var dec = decipher.update(data,'hex','utf8');
        dec += decipher.final('utf8');
        return dec;
    }

    /**
     * Creates a encrypted database key that can be used to query for values
     * @param  {[type]} dataId  [description]
     * @param  {[type]} session [description]
     * @return {[type]}         [description]
     */
    function getDbKey(dataId, session) {
        var cipher = crypto.createCipher('aes-256-cbc', session.id + "_" + nigel.config.uniqueKey);
        var text = dataId;
        var crypted = cipher.update(text,'utf8','hex');
        crypted += cipher.final('hex');
        return crypted;
    }

    /**
     * Generates a new token containing the given values
     * @param  {[type]} dataId   [description]
     * @param  {[type]} dataType [description]
     * @param  {[type]} session  [description]
     * @param  {[type]} meta     [description]
     * @return {[type]}          [description]
     */
    function generateToken (dataId, dataType, session, meta) {
        for (var token in tokens) {
            var tokenData = tokens[token];
            if (tokenData.dataId == dataId && tokenData.session == session) {
                delete tokens[token];
                break;
            }
        }
        var newToken = md5(new Date().getTime() + seed);
        tokens[newToken] = { dataId: dataId, dataType: dataType, session: session, meta: meta };
        return newToken;
    }

    /**
     * Determines whether or not the given tokenId is valid
     * @param  {[type]} tokenId [description]
     * @return {[type]}         [description]
     */
    function validToken (tokenId) {
        return !!tokens[tokenId];
    }

    /**
     * Sets the given value in the database based on the given token
     * @param {[type]} token [description]
     * @param {[type]} value [description]
     */
    function setFromToken (token, value) {
        if (validToken(token)) {
            var tokenData = tokens[token];
            if (tokenData) {
                self.set(tokenData.dataId, tokenData.dataType, tokenData.session, value);
                delete tokens[token];
            }
        }
    };

    /**
     * Retrieves authentication based on the given arguments
     * @param  {[type]} dataId The id of of the authentication data to retrieve
     * @param  {[type]} dataType The type of the authentication data to retrieve
     * @param  {[type]} session The session to get the info for
     * @return {[type]}          [description]
     */
    this.get = function (dataId, dataType, session) {
        var result = q.defer();
        db.get("SELECT * FROM user_creds WHERE key = $key", {
            $key: getDbKey(dataId, session)
        }, function (err, row) {
            if (!row) {
                var token = generateToken(dataId, dataType, session);
                result.reject({
                    type: "FILL_CREDENTIALS", //
                    data: {
                        url: nigel.config.baseUrl + "/auth?tId=" + token
                    }
                });
            } else {
                result.resolve(JSON.parse(decryptData(dataId, session, row.value)));
            }
        });
        return result.promise;
    };

    /**
     * Sets the authentication data identified by the parameters to the given value
     * @param {[type]} dataId The id of the data
     * @param {[type]} dataType The type of the data
     * @param {[type]} session The session to set the value for
     * @param {[type]} value The authentication data value
     */
    this.set = function (dataId, dataType, session, value) {
        var newData = encryptData(dataId, session, JSON.stringify(value));
        var newKey = getDbKey(dataId, session);
        db.run("INSERT OR REPLACE INTO user_creds (key, value) VALUES (?,?)", [newKey, newData]);
    };

    nigel.server.get('/auth', function (req, res) {
        if (req.query.tId && validToken(req.query.tId)) {
            var tokenData = tokens[req.query.tId];
            res.render(tokenData.dataType, {
                tId: req.query.tId
            });
        } else {
            res.end("Invalid!");
        }
    });

    nigel.server.post('/auth', function (req, res) {
        if (req.body.tId && validToken(req.body.tId)) {
            // TODO: Using req.body is not secure, someone could just
            // put whatever values onto the page, and it'll get stored in the db
            delete req.body.tId;
            setFromToken(req.query.tId, req.body);
            res.end("Updated Credentials");
        } else {
            res.end("Invalid!");
        }
    });

    initDb();
}

module.exports = NigelAuth;