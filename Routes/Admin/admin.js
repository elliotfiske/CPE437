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
   res.json((new Date()).getTime());
});

// Change date
router.post('/time', function(req, res) {
   var currDate = new Date();
   currDate.setDate(currDate.getDate() + req.body.day);

   console.log(currDate);
   console.log("Days: ", req.body);
   timekeeper.travel(currDate);

   res.sendStatus(200);
});

module.exports = router;
