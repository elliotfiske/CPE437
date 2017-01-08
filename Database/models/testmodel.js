'use strict';
module.exports = function(sequelize, DataTypes) {
  var TestModel = sequelize.define('TestModel', {
    name: DataTypes.STRING,
    text: DataTypes.TEXT,
    url: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return TestModel;
};