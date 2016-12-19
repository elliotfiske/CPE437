var expect = require("chai").expect;
var request = require("request-promise");
var util = require("./test-util");

function failTest(done) {
   return function(err) {
      console.error(err);
      expect(true).to.equal(false);
      done();
   }
}

var sessions = {};

describe("Challenge API Endpoint", function() {
   describe("Challenge Creation", function() {
      it("Can log in", function(done) {
         util.post({
            uri: 'http://localhost:3000/ssns',
            body: {email: "Admin@11.com", password: "password"}
         })
         .then(function(result) {
            var location = result.headers["location"];
            sessions["admin"] = /\/([A-z0-9]+)$/g.exec(location)[1];  // i like to practice regexes and alienate anyone trying to read my code
            done();
         })
         .catch(failTest(done));
      });

      it("Can make challenges", function(done) {
         util.post({
            uri: 'http://localhost:3000/prss',
            body: {
               "email": "Steinke@sfhs",
               "name": "mr.steinke",
               "password" : "csisfunner",
               "role"     : 1,
               "termsAccepted": true
            }
         })
         .then(function(result, headers) {
            done();
         })
         .catch(failTest(done));
      });
   });
});
