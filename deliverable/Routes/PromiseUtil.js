var Promise = require('bluebird');

module.exports.Error = function (code, message) {
  var err = new Error(message);
  err.statusCode = code;
  return Promise.reject(err);
};
