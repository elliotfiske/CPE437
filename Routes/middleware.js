var sequelize = require('./sequelize.js');
var doErrorResponse = require('./Validator.js').doErrorResponse;
var Tags = require('./Validator.js').Tags;

var exports = module.exports = {};

// This is called any time when we need to display the streak. This will happen
//  when we look at a course page, or when we complete a challenge. Make sure
//  you call getCourseModel somewhere before
exports.updateStreak = function(req, res, next) {
   var vld = req.validator;

   if (!req.course) {
      console.error("You didn't put the getCourseModel middleware before this middleware!");
      res.sendStatus(500);
   }

   return sequelize.Enrollment.findOne({
      where: {personId: req.session.id, courseName: req.course.sanitizedName}
   })
   .then(function(enr) {
      return vld.check(enr, Tags.noPermission, null, enr,
         "You're not enrolled for that class.");
   })
   .then(function(enr) {
      // When was the last time the user made an attempt?
      var now  = Date.now();
      var then = enr.lastStreakTime.getTime();
      var DAY_MS = 86400 * 1000; // 1 day fam

      if (now - then > DAY_MS) { // 2 far in the past 4 u
         return enr.updateAttributes({
            streak: 0
         });
      }
   })
   .then(function() {
      next();
   })
   .catch(doErrorResponse(res));
}
