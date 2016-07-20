var mysql = require('mysql');

var Connections = function() {
   var poolCfg = require('./connection.json');
   var env = process.env;

   // Use openshift environment variables if available, else connection.json default.
   poolCfg.host = env.OPENSHIFT_MYSQL_DB_HOST || poolCfg.host;
   poolCfg.user = env.OPENSHIFT_MYSQL_DB_USERNAME || poolCfg.user;
   poolCfg.password = env.OPENSHIFT_MYSQL_DB_PASSWORD || poolCfg.password;
   poolCfg.port = env.OPENSHIFT_MYSQL_DB_PORT || poolCfg.port;
   poolCfg.database = env.OPENSHIFT_GEAR_NAME || poolCfg.database;

   poolCfg.connectionLimit = 1;//Connections.PoolSize;
   this.pool = mysql.createPool(poolCfg);
};

Connections.PoolSize = 5;

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

Connections.prototype.getWorkConnection = function(cb) {
   this.pool.getConnection(cb);
};

module.exports = new Connections();
