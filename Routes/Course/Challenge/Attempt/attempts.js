var Express = require('express');
var connections = require('../../../Connections.js');
var Tags = require('../../../Validator.js').Tags;
var doErrorResponse = require('../../../Validator.js').doErrorResponse;
var sequelize = require('../../../sequelize.js');
var Promise = require('bluebird');
var updateStreak = require('../../../middleware.js').updateStreak;

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
      input = input.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""); // strip punctuation

      input.split(" ").forEach(function(word) {
         console.log("Checking " + word + " against ", answer);
         if (answer.indexOf(word) >= 0) {
            result.score = 5;
            result.correct = true;
         }
      });
   }
   else {
      throw new Error("Bad challenge type, somehow!");
   }

   return result;
}

router.post('/', updateStreak, function(req, res) {
   var prsId = req.session.id;
   var vld = req.validator;

   return vld.hasFields(req.body, ['input'])
   .then(function() {
      return sequelize.Person.findById(prsId);
   })
   .then(function(user) {
      return user.hasClass(req.course)
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

         return vld.check(!alreadyGotItRight && req.challenge.attsAllowed > attempts.length, Tags.excessatts, null, attempts, "You already got this answer correct.");
      })
      .then(function(attempts) {
         // TODO: verify chl's start date is after today
         var result = checkAnswer(req);

         return sequelize.Enrollment.findOne({
            where: {personEmail: user.id, courseName: req.course.sanitizedName}
         })
         .then(function(enr) {
            result.score += enr.streak;
            return enr.increment({creditsEarned: result.score});
         })
         .then(function(enr) {
            // if lastStreakTime is in the PAST, that means we haven't earned a streak
            //  point today.
            if (enr.lastStreakTime < new Date() && attempts.length === 0) {
               return enr.increment('streak')
               .then(function(enr) {
                  var tonightMidnight = new Date();
                  tonightMidnight.setHours(24,0,0,0);
                  return enr.updateAttributes({lastStreakTime: tonightMidnight});
               });
            }
            else {
               return Promise.resolve(enr);
            }
         })
         .then(function(enr) {
            return sequelize.Attempt.create({
               input: req.body.input,
               personId: prsId,
               challengeName: req.params.challengeName,
               correct: result.correct,
               pointsEarned: result.score
            });
         })
         .then(function() {
            res.json(result);
         });
      });
   })
   .catch(doErrorResponse(res));
});

module.exports = router;
