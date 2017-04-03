var schedule = require('node-schedule');
var fs = require('fs');
var sequelize = require('../Routes/sequelize');
var doErrorResponse = require('../Routes/Validator.js').doErrorResponse;
var email = require('./emailSender.js');

// key is user id, value is cancellable job object
var streakReminderJobs = {};

// Given all the enrollments for one Person, check if any are about to become overdue.
function doStreakWarnings(enrs, dude) {
   enrs.forEach(function(enr) {
      if (enr.lastStreakTime < new Date()) {
         var subject = "[" + enrs.courseName + "]" + " Your " + enr.streak + "-day streak is about to expire!";
         var body = dude.name + ", don't lose your " + enr.streak + "-day streak! Attempt a challenge now to maintain it! (You don't even have to get it right!)";
         var link = email.BASE_URL + "/#/course/" + enr.courseName;
         var textPreview = "Your " + enr.streak + "-day streak is about to expire!";

         email.sendEmail(subject, body, link, textPreview, dude);
      }
   });
}

// Set up recurring streak reminder jobs for all students
sequelize.Person.findAll({where: {role: 2}})
.then(function(everyone) {
   everyone.forEach(function(dude) {

      var recurrenceRule = new schedule.RecurrenceRule();
      recurrenceRule.hour = 22;
      recurrenceRule.minute = 0;

      var j = schedule.scheduleJob(recurrenceRule, function() {
         sequelize.Enrollment.findAll({where: {personEmail: dude.email}})
         .then(function(enrs) {
            doStreakWarnings(enrs, dude);
         })
         .catch(doErrorResponse(null));
      });

      streakReminderJobs[dude.id] = j;
   });

   console.log("Hey! Set up streak reminder jobs for " + everyone.length + " students.");
})
.catch(doErrorResponse(null));
