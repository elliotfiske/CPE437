var Express = require('express');
var Promise = require('bluebird');
var timekeeper = require('timekeeper');

var connections = require('../Connections.js');
var sequelize = require('../sequelize.js');
var Tags = require('../Validator.js').Tags;
var doErrorResponse = require('../Validator.js').doErrorResponse;
var router = Express.Router({caseSensitive: false});

router.baseURL = '/admin';

// Return the system time
router.get('/time', function(req, res) {
   res.json(Date.now());
});

router.post('/seed', function(req, res) {
   return sequelize.Person.findOrCreate({
     where: {email: 'SEED_steinke@calpoly.edu'},
     defaults: {name: 'Larry', password: "password", role: 1}});
   })
   .then(function(steinke) {
      return sequelize.Course.findOrCreate({
         where: {sanitizedName: 'cpe-000'},
         defaults: {name: 'CPE 000', ownerId: steinke.id}
      })
      .then(function(cpe000) {
         return sequelize.Challenge.findOrCreate({
            where: {sanitizedName: 'seed_chl1'},
            defaults: {
               name: "seed_chl1",
               description: "seed challenge 1",
               attsAllowed: 5,
               type : "shortanswer",
               answer : "[test]",
               weekIndex : 0,
               dayIndex : 0
            }
         })
         .then(function(chl) {
            cpe000.Weeks[0].
         });
      });
   })
});

module.exports = router;
