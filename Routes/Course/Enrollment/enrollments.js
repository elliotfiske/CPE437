var Express = require('express');
var Promise = require('bluebird');
var connections = require('../../Connections.js');
var sequelize = require('../../sequelize.js');
var Tags = require('../../Validator.js').Tags;
var doErrorResponse = require('../../Validator.js').doErrorResponse;
var router = Express.Router({caseSensitive: false});
var updateStreak = require('../../middleware.js').updateStreak;
router.baseURL = '/enrs';

router.post('/', function(req, res) {
   var vld = req.validator;
   var prs = req.session;

   return vld.hasFields(req.body, ['prsId'])
   .then(function() {
      return sequelize.Person.findById(req.body.prsId);
   })
   .then(function(person) {
      return vld.check(person, Tags.notFound, null, person, "Couldn't find a user with ID " + req.body.prsId);
   })
   .then(function(person) {

      return vld.check(prs.isAdmin() || prs.id === req.body.prsId || // Are you Admin, enrolling yourself,
      req.course.ownerId === prs.id, Tags.noPermission) // or the teacher of this course?
      .then(function() {
         return person.hasClass(req.course);
      })
      .then(function(alreadyAdded) {
         return vld.check(!alreadyAdded, Tags.dupName, null, null, "Student is already enrolled for that class.");
      })
      .then(function() {
         return person.addClass(req.course);
      })
      .then(function() {
         return person.getClasses();
      })
      .then(function(classes) {
         res.json(classes).end();
      });
   })
   .catch(doErrorResponse(res));
});

router.get('/', function(req, res) {
   var vld = req.validator;
   var prs = req.session;

   return vld.checkPrsOK(req.course.ownerId)
   .then(function() {
      return req.course.getEnrolledDudes();
   })
   .then(function(dudes) {
      res.json(dudes);
   })
   .catch(doErrorResponse(res));
});

router.delete('/:name/enrs/', function(req, res) {
   var vld = req.validator;

   return vld.checkAdmin()
   .then(function() {
      return vld.hasFields(req.body, ['email']);
   })
   .then(function() {
      return sequelize.Enrollment.findOne({
         where: {personEmail: req.body.email, courseName: req.course.sanitizedName}
      });
   })
   .then(function(enr) {
      return enr.destroy();
   })
   .catch(doErrorResponse(res));
});

module.exports = router;
