var mysql = require('mysql');
var mysqlP = require('promise-mysql');
var Promise = require('bluebird');

var Connections = function() {
   var poolCfg = require('./connection.json');
   var env = process.env;

   var onHeroku = !!process.env.DYNO;
   console.log('Am I on Heroku? ' + (onHeroku ? 'yeah' : 'nah'));

   // Use openshift environment variables if available, else connection.json default.
   poolCfg.host = env.CLEARDB_HOST || poolCfg.host;
   poolCfg.user = env.CLEARDB_USERNAME || poolCfg.user;
   poolCfg.password = env.CLEARDB_PASSWORD || poolCfg.password;
   poolCfg.port = env.CLEARDB_PORT || poolCfg.port;
   poolCfg.database = env.CLEARDB_DB_NAME || poolCfg.database;

   poolCfg.connectionLimit = Connections.PoolSize;
   this.pool = mysql.createPool(poolCfg);

   this.poolP = mysqlP.createPool(poolCfg);
};

Connections.PoolSize = 10;

// Return a connection, possibly augmented for deadlock
// retry (so don't just get it straight from pool).
// Call |cb| with any error and the connection once it becomes
// available.  A release call is required on the connection
// once done.
// Todo: Wrap returned cnn to perform retries on deadlock, in fashion like:
// https://github.com/Badestrand/node-mysql-deadlock-retries/blob/master/index.jsConnections.prototype.getConnection = function(cb) {

Connections.prototype.getConnection = function(res, cb) {
   this.pool.getConnection(function (err, cnn) {
      if (err)
         res.status(500).send('DB ERROR');
      else
         cb(cnn);
   });
};

Connections.prototype.getConnectionP = function() {
  var self = this;
  return this.poolP.getConnection().then(function(connection) {
    connection.release = function() {
      self.poolP.releaseConnection(this);
    };

    return connection;
  }).catch(function(err) {
    return Promise.reject({status: 500, message: "DB ERROR"});
  });
};

Connections.prototype.getWorkConnection = function(cb) {
   this.pool.getConnection(cb);
};

module.exports = new Connections();
