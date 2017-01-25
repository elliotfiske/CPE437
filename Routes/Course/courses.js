var Express = require('express');
var Promise = require('bluebird');
var connections = require('../Connections.js');
var sequelize = require('../sequelize.js');
var Tags = require('../Validator.js').Tags;
var doErrorResponse = require('../Validator.js').doErrorResponse;
var router = Express.Router({caseSensitive: false});
var updateStreak = require('../middleware.js').updateStreak;
router.baseURL = '/crss';

// Every challenge needs the correct course object, so let's find it here
function getCourseModel(req, res, next) {
  var vld = req.validator;

  sequelize.Course.findOne({where: {sanitizedName: req.params.courseName}})
  .then(function(course) {
    return vld.check(course, Tags.notFound, null, course, "Couldn't find a course named " + req.params.courseName);
  })
  .then(function(course) {
    req.course = course;
    next();
  })
  .catch(doErrorResponse(res));
}

var challengeRouter = require('./Challenge/challenges.js');
router.use('/:courseName/challenge', getCourseModel, challengeRouter);

var enrollmentsRouter = require('./Enrollment/enrollments.js');
router.use('/:courseName/enrs', getCourseModel, enrollmentsRouter);

router.get('/', function(req, res) {
  var vld = req.validator;

  sequelize.Course.findAll()
  .then(function(courseList) {
    // TODO: also grab today's challenge
    res.json(courseList);
  })
  .catch(doErrorResponse(res));
});

router.post('/', function(req, res) {
   var vld = req.validator;

   return vld.checkAdmin()
   .then(function() {
      return vld.hasFields(req.body, ["name", "owner"]);
   })
   .then(function() {
      return sequelize.Person.findOne({where: {email: req.body.owner}})
      .then(function(teacher) {
         return vld.check(teacher && teacher.role >= 1, Tags.notFound, null, teacher, "No teacher found for email " + req.body.owner);
      })
      .then(function(teacher) {
         return sequelize.Course.create({
            name: req.body.name,
            ownerId: teacher.id,
         })
         .then(function(newCourse) {
            newCourse.addEnrolledDude(teacher);
         });
      });
   })
   .then(function(newCourse) {
      res.location(router.baseURL + '/' + req.body.name).status(200).end();
   })
   .catch(doErrorResponse(res));
});

router.put('/:name', function(req, res) {
  var vld = req.validator;
  var body = req.body;
  var admin = req.session.isAdmin();

  return vld.checkAdminOrTeacher(req.params.id)
  .then(function() {
    return connections.getConnectionP();
  })
  .then(function(conn) {

    return conn.query('SELECT * FROM Course where name = ?', [req.params.name])
    .then(function(courseResult) {
      return vld.check(courseResult.length === 1, Tags.notFound, null, courseResult);
    })
    .then(function(courseResult) {
      return vld.checkPrsOK(courseResult[0].ownerId);
    })
    .then(function() {
      return vld.check(req.body.ownerId == undefined || admin, Tags.noPermission);
    })
    .then(function() {
      if (req.body.name !== undefined) {
        return conn.query('SELECT * FROM Course where name = ?', [req.body.name]);
      }
      else {
        return Promise.resolve(null);
      }
    })
    .then(function(checkDupNameCourseResult) {
      return vld.check(checkDupNameCourseResult === null || checkDupNameCourseResult.length === 0, Tags.dupName)
    })
    .then(function() {
      return conn.query('UPDATE Course SET ? WHERE name = ?', [req.body, req.params.name]);
    })
    .then(function(result) {
      res.status(200).json(result);
    })
    .finally(function() {
      conn.release();
    });
  })
  .catch(doErrorResponse(res));
});

router.get('/:courseName', getCourseModel, updateStreak, function(req, res) {
   var vld = req.validator;

   return sequelize.Person.findById(req.session.id)
   .then(function(prs) {
      return sequelize.Enrollment.findOne({
         where: {personEmail: prs.id, courseName: req.course.sanitizedName},
         raw: true
      });
   })
   .then(function(enr) {
      return vld.check(enr, Tags.noPermission, null, enr, "You're not enrolled in that class.");
   })
   .then(function(enr) {
      var courseResult = req.course.get({plain: true});
      courseResult.Enrollments = [enr];
      res.json(courseResult);
   })
   .catch(doErrorResponse(res));
});


router.get('/:name/chls', function(req, res) {
  var vld = req.validator;
  var prs = req.session;

  var getPerson = sequelize.Person.findById(prs.id);
  var getCourse = sequelize.Course.findOne({ where: {sanitizedName: req.params.name} });

  return Promise.all([getPerson, getCourse])
  .spread(function(person, course) {
    return person.hasClass(course)
    .then(function(isEnrolled) {
      return vld.check(isEnrolled || course.ownerId === prs.id || req.isAdmin(), Tags.noPermission);
    })
    .then(function() {
      return course.getWeeks({include: [{model: sequelize.Challenge}]});
    })
    .then(function(weeks) {
      res.json(weeks);
    });
  })
  .catch(doErrorResponse(res));
});

// Get the tags you've used before on a class
router.get('/:crsName/tags', function(req, res) {
  var vld = req.validator;

  return sequelize.Course.findOne({
    where: {sanitizedName: req.params.crsName},
    include: [{ model: sequelize.ChallengeTag}]
  })
  .then(function(course) {
    return vld.check(course, Tags.notFound, null, course, "Couldn't find a course named " + req.params.crsName + ".");
  })
  .then(function(course) {
    return vld.checkPrsOK(course.ownerId, course);
  })
  .then(function(course) {
    return res.json(course["ChallengeTags"]);
  })
  .catch(doErrorResponse(res));
});

module.exports = router;
