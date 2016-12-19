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
function checkAnswer(req, chl) {
   var input = req.body.input.toLowerCase();
   var answer = chl.answer.toLowerCase();
   var result = {
      score: 0,
      correct: false
   };

   if (chl.type == 'number' || chl.type === 'multchoice') {
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
   else if (chl.type === 'shortanswer') {
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
      var findChallenge = sequelize.Challenge.findOne({
         where: {sanitizedName: req.params.challengeName}
      });

      var findCourse = sequelize.Course.findOne({
         where: {sanitizedName: req.params.courseName}
      });

      var findUser = sequelize.Person.findById(prsId);

      return Promise.all([findChallenge, findCourse, findUser]);
   })
   .spread(function(chl, course, user) {
      // return vld.check(chl && course && user, )
      return course.hasEnrolledDude(user)
      .then(function(isEnrolled) {
         if (!isEnrolled) {
            return Promise.reject({message: "You're not enrolled for that class."});
         }
         return chl.getAttempts({
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

         return vld.check(!alreadyGotItRight && chl.attsAllowed > attempts.length, Tags.excessatts);
      })
      .then(function() {
         // TODO: verify chl's start date is after today
         var result = checkAnswer(req, chl);

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
            challengeName: chl.sanitizedName,
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

// WHEN WE RETURN: attempt.get. Return the list of attempts that the user has
//   previously made, to give them reference for their next attempt OR to
//   see what the right answer was.

module.exports = router;
