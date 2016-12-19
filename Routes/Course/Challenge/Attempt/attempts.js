var Express = require('express');
var connections = require('../../../Connections.js');
var Tags = require('../../../Validator.js').Tags;
var doErrorResponse = require('../../../Validator.js').doErrorResponse;
var sequelize = require('../../../sequelize.js');
var Promise = require('bluebird');

var router = Express.Router({caseSensitive: false, mergeParams: true});
var async = require('async');
router.baseURL = '/attempt';

// Check that the user got the right answer
function checkAnswer(req) {
   var input = req.body.input.toLowerCase();
   var answer = req.challenge.answer.toLowerCase();
   var result = {
      score: 0,
      correct: false
   };

   if (req.challenge.type == 'number' || req.challenge.type === 'multchoice') {
      input = parseInt(input);
      answer = parseInt(answer);

      if (Number.isNaN(input)) {
         throw new Error("Please enter a number!");
      }
      else {
         result.score = 5;
         result.correct = true;
      }
   }
   else if (req.challenge.type === 'shortanswer') {
      answer = JSON.parse(answer);

      if (answer.indexOf(input) >= 0) {
         result.score = 5;
         result.correct = true;
      }
   }
   else {
      throw new Error("Bad challenge type, somehow!");
   }

   return result;
}

router.post('/', function(req, res) {
   var prsId = req.session.id;
   var vld = req.validator;

   return vld.hasFields(req.body, ['input'])
   .then(function() {
     return sequelize.Person.findById(prsId);
   })
   .then(function(user) {
     return req.course.hasEnrolledDude(user)
     .then(function(isEnrolled) {
       return vld.check(isEnrolled, Tags.noPermission, null, null, "You're not enrolled for that class.");
     })
     .then(function() {
       return req.challenge.getAttempts({
         where: {personId: prsId},
         required: false
       });
     })
     .then(function(attempts) {
       var alreadyGotItRight = false;
       attempts.forEach(function(att) {
         if (att.correct) {
           alreadyGotItRight = true;
         }
       });

       return vld.check(!alreadyGotItRight && req.challenge.attsAllowed > attempts.length, Tags.excessatts);
     })
     .then(function() {
       // TODO: verify chl's start date is after today
       var result = checkAnswer(req);

       // TODO: check streak here.
       // How it'll go down:
       //   check to see if there's a previous challenge the user didn't complete
       //   on a previous day. If so, reset the streak :
       //
       // otherwise, grab the streak field, add 1, and give a bonus based
       //   on the streak.

       return sequelize.Attempt.create({
         input: req.body.input,
         personId: prsId,
         challengeName: req.params.challengeName,
         correct: result.correct,
         pointsEarned: result.score
       })
       .then(function() {
         res.json(result);
       });
     });
   })
   .catch(doErrorResponse(res));
 });

module.exports = router;
