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
      else if( Math.abs(input - answer) < 1.0 ) {
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
      return vld.check(!req.body.input.test || req.session.isTeacherOrAdmin(), Tags.noPermission, null, user, "You can't turn on test mode, you're not a teacher!");
   })
   .then(function(user) {
      return vld.check(user.checkedDisclaimer === 1, Tags.noTerms, null, user, "You haven't accepted the terms and conditions!");
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

         return vld.check(!alreadyGotItRight && req.challenge.attsAllowed > attempts.length, Tags.excessatts, null, attempts, "You can't attempt that question anymore.");
      })
      .then(function(attempts) {
         // TODO: verify chl's start date is after today
         var result = checkAnswer(req);
         return sequelize.do.query("SELECT COUNT(DISTINCT DATE_FORMAT(createdAt, '%c %d %Y')) FROM Attempt WHERE personId = :pid;", {
            replacements: { pid: req.session.id }, type: sequelize.do.QueryTypes.SELECT
         }).then(function(commitment) {
            console.log()
            var userCommitment = commitment[0]["COUNT(DISTINCT DATE_FORMAT(createdAt, '%c %d %Y'))"];

            return sequelize.Enrollment.findOne({
               where: {personEmail: user.id, courseName: req.course.sanitizedName}
            })
            .then(function(enr) {
               var netScore = 0; // Weird hack.. in the long run maybe we should just calculate score on the fly
               if (result.correct) {
                  attempts.forEach(function(att) {
                     netScore -= att.pointsEarned;
                  });
               }
               result.score += userCommitment;
               return enr.increment({creditsEarned: result.score + netScore});
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
               result.attsLeft = req.challenge.attsAllowed - attempts.length - 1;
               result.commitment = userCommitment;
               res.json(result);
            })
            .then(function() {
               var attClear = [];
               attempts.forEach(function(att) {
                  attClear.push(att.update({pointsEarned: 0}));
               });
               return Promise.all(attClear);
            });
         });
      });
   })
   .catch(doErrorResponse(res));
});

module.exports = router;
