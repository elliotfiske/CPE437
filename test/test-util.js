var expect = require("chai").expect;
var request = require("request-promise");

module.exports = {
   post: request.defaults({
      method: 'POST',
      json: true,
      resolveWithFullResponse: true,
      jar: true
   })
}
