var nodemailer = require('nodemailer');
var schedule = require('node-schedule');
var fs = require('fs');
var sequelize = require('../Routes/sequelize');
var doErrorResponse = require('../Routes/Validator.js').doErrorResponse;

var transporter = nodemailer.createTransport(process.env.GMAIL_SMTP);

// Stores the base email template, with %VARIABLES% like this that we replace
var EMAIL_TEMPLATE = "";
var BASE_URL = "https://elliot-commitment.herokuapp.com"; // TODO: If this changes, change this

var onHeroku = !!process.env.DYNO;
if (!onHeroku) {
   BASE_URL = "http://localhost:3000/";
}

fs.readFile('./resources/email-template.html', 'utf8', function(err, data) {
   if (err) {
      console.error('Could not read from file...', err);
   }
   else {
      EMAIL_TEMPLATE = data;
   }
});

// key is user id, value is cancellable job object
var streakReminderJobs = {};

// Given all the enrollments for one Person, check if any are about to become overdue.
function doStreakWarnings(enrs, dude) {
   enrs.forEach(function(enr) {
      if (enr.lastStreakTime < new Date()) {
         var textPreview = "Your " + enr.streak + "-day streak is about to expire!";

         var specificEmail = EMAIL_TEMPLATE.replace("%TEXTPREVIEW%", textPreview);
         specificEmail = specificEmail.replace("%BODY%", dude.name + ", don't lose your " + enr.streak + "-day streak! Attempt a challenge now to maintain it! (You don't even have to get it right!)");
         specificEmail = specificEmail.replace("%LINK%", BASE_URL + "/#/course/" + enr.courseName);
         specificEmail = specificEmail.replace("%UNSUBLINK%", BASE_URL + "/#/unsubscribe?email=" + dude.email);

         var mailOptions = {
            to: dude.email,
            text: textPreview,
            html: specificEmail,
            subject: "[" + enrs.courseName + "]" + " Your " + enr.streak + "-day streak is about to expire!"
         }
         transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
               return console.log(error);
            }
            console.log('Message sent: ' + info.response);
         });
      }
   });
}

// Set up recurring streak reminder jobs for all students
sequelize.Person.findAll({where: {role: 0}})
.then(function(everyone) {
   everyone.forEach(function(dude) {

      var recurrenceRule = new schedule.RecurrenceRule();
      recurrenceRule.hour = 22;
      recurrenceRule.minute = 17;

      var j = schedule.scheduleJob(recurrenceRule, function() {
         sequelize.Enrollment.findAll({where: {personId: dude.id}})
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
