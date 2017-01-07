var sequelize = require('./sequelize.js');
var doErrorResponse = require('./Validator.js').doErrorResponse;
var ssnUtil = require('./Session.js');
var Tags = require('./Validator.js').Tags;

var exports = module.exports = {};

exports.getCurrentUser = function(req, res, next) {
   var vld = req.validator;
   return sequelize.Person.findById(req.session.id)
   .then(function(prs) {
      return vld.check(prs, Tags.notFound, null, prs, "Who are you???");
   })
   .then(function(prs) {
      req.user = prs;
   })
   .catch(doErrorResponse(res));
};

// This is called any time when we need to display the streak. This will happen
//  when we look at a course page, or when we complete a challenge. Make sure
//  you call getCourseModel somewhere before
exports.updateStreak = function(req, res, next) {
   var vld = req.validator;

   if (!req.course) {
      console.error("You didn't put the getCourseModel middleware before this middleware!");
      res.sendStatus(500);
      return;
   }

   return sequelize.Person.findById(req.session.id)
   .then(function(prs) {
      return sequelize.Enrollment.findOne({
         where: {personEmail: prs.email, courseName: req.course.sanitizedName}
      });
   })
   .then(function(enr) {
      return vld.check(enr, Tags.noPermission, null, enr, "You're not enrolled for that class.");
   })
   .then(function(enr) {
      // When was the last time the user made an attempt?
      var now  = Date.now();
      var then = enr.lastStreakTime.getTime();
      var DAY_MS = 86400 * 1000; // 1 day fam

      if (now - then > DAY_MS) {
         // 2 far in the past 4 u
         return enr.updateAttributes({
            streak: 0
         });
      }
   })
   .then(function() {
      next();
   })
   .catch(doErrorResponse(res));
};

// Return the oldest challenge for this course that hasn't been completed.
exports.getActiveChallenge = function(req, res, next) {
   var vld = req.validator;

   if (!req.course) {
      conosle.error("req dot course not populated!");
      res.sendStatus(500);
      return;
   }

   return sequelize.Challenge.findAll({
      where: {
         courseName: req.course.sanitizedName
      },
      order: [['openDate', 'ASC']],
      include: [{
         model: sequelize.Attempt,
         where: {personId: req.session.id},
         required: false
      }],
      limit: 5
   })
   .then(function(chls) {
      for (var ndx = 0; ndx < chls.length; ndx++) {
         if (chls[ndx].Attempts.length === 0) {
            req.activeChallenge = chls[ndx];
            next();
            return true; // short-circuits the "some"
         }
      }
      next();
      return false; // continues the "some"
   })
   .catch(doErrorResponse(res));
};

exports.login = function(req, res) {
   return sequelize.Person.findOne({where: {email: req.body.email}})
   .then(function(user) {
      return vld.check(user && user.password === req.body.password, Tags.badLogin, null, user, "Bad email or password.");
   })
   .then(function(user) {
      var cookie = ssnUtil.makeSession(user, res);
      res.location(router.baseURL + '/'  + cookie).end();
   })
   .catch(doErrorResponse(res));
};
