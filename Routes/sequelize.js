var Sequelize = require('sequelize');

var poolCfg = require('./connection.json');
var env = process.env;

var db = env.CLEARDB_DB_NAME || poolCfg.database;
var username = env.CLEARDB_USERNAME || poolCfg.user;
var pass = env.CLEARDB_PASSWORD || poolCfg.password;
var host = env.CLEARDB_HOST || poolCfg.host;

var sequelize = new Sequelize(db, username, pass, {
  host: host,
  dialect: 'mysql',

  pool: {
    max: 10,
    min: 0,
    idle: 10000
  }
});

var Week = sequelize.define('week', {
  weekNameTest: {
    type: Sequelize.STRING
  },
  weekNum: {
    type: Sequelize.INTEGER
  }
}, {
  timestamps: true,
  freezeTableName: true // Model tableName will be the same as the model name
});

Week.sync().then(function () {
  // Table created
  return Week.create({
    weekNameTest: 'sillyWeek',
    weekNum: 3,
  });
});

module.exports = {Week: Week};
