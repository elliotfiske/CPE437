var Express = require('express');
var connections = require('../../../Connections.js');
var Tags = require('../../../Validator.js').Tags;
var doErrorResponse = require('../../../Validator.js').doErrorResponse;
var sequelize = require('../../../sequelize.js');

var router = Express.Router({caseSensitive: false, mergeParams: true});
var async = require('async');
router.baseURL = '/attempt';

router.post('/', function(req, res) {
   var prsId = req.session.id;
   var vld = req.validator;

   return vld.hasFields(req.body, ['input'])
   .then(function() {
      console.log(JSON.stringify(req.body));
      return sequelize.Challenge.findOne({where:
         {name: req.params.challengeName}
      });
   })
   .then(function(chl) {
      var input = req.body.input.toLowerCase();
      var answer = chl.answer.toLowerCase();
      var result = {
         score: 0,
         correct: false
      }

      if (chl.type == 'number' || chl.type === 'multchoice') {
         input = parseInt(input);
         answer = parseInt(answer);

         if (Number.isNaN(input)) {
            return Promise.reject({errMsg: "Please enter a number!"});
         }
         else {
            result.score = 5;
            result.correct = true;
         }
      }
      else if (chl.type === 'shortanswer') {
         answer = JSON.parse(answer);

         if (answer.indexOf(input) >= 0) {
            result.score = 5;
            result.correct = true;
         }
      }
      else {
         return Promise.reject({errMsg: "Bad Challenge Type: " + chl.type});
      }

      // TODO: check streak here.
      // How it'll go down:
      //   check to see if there's a previous challenge the user didn't complete
      //   on a previous day. If so, reset the streak :
      //
      // otherwise, grab the streak field, add 1, and give a bonus based
      //   on the streak.

      res.json(result);
   })
   .catch(doErrorResponse(res));
});

module.exports = router;
