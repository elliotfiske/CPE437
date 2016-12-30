var Express = require('express');
var Promise = require('bluebird');
var connections = require('../Connections.js');
var sequelize = require('../sequelize.js');
var Tags = require('../Validator.js').Tags;
var doErrorResponse = require('../Validator.js').doErrorResponse;
var router = Express.Router({caseSensitive: false});
router.baseURL = '/crss';

// Every challenge needs the correct course object, so let's find it here
function getCourseModel(req, res, next) {
  var vld = req.validator;

  console.log("MIDDLEWARE TO THE RESCUE!");

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

// This is called any time when we need to display the streak. This will happen
//  when we look at a course page, or when we complete a challenge. Make sure
//  you call getCourseModel somewhere before
var updateStreak = function(req, res, next) {
   if (!req.course) {
      console.error("You didn't put the getCourseModel middleware before this middleware!");
      res.sendStatus(500);
   }

   return sequelize.Enrollment.findOne({
      where: {personId: req.session.id, courseName: req.course.sanitizedName}
   })
   .then(function(enr) {
      // When was the last time the user made an attempt?
      var now  = Date.now();
      var then = enr.lastStreakTime.getTime();
      var DAY_MS = 86400000;

      if (now - then > DAY_MS) { // 2 far in the past 4 u
         return enr.updateAttributes({
            streak: 0
         });
      }
   })
   .catch(doErrorResponse(res));
}

var challengeRouter = require('./Challenge/challenges.js');
router.use('/:courseName/challenge', getCourseModel, challengeRouter);

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
      return sequelize.Course.findById(req.body.name);
   })
   .then(function(existingCourse) {
      return vld.check(!existingCourse, Tags.dupName, null, null, "There's already a course named " + req.body.name);
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
   return sequelize.Enrollment.findOne({
      where: {personId: req.session.id, courseName: req.course.sanitizedName},
      raw: true
   })
   .then(function(enr) {
      req.course.Enrollments = [enr];
      res.json(req.course);
   })
   .catch(doErrorResponse(res));
});

router.post('/:name/enrs', function(req, res) {
  var vld = req.validator;
  var prs = req.session;

  var getPerson = sequelize.Person.findById(req.body.prsId);
  var getCourse = sequelize.Course.findOne({ where: {sanitizedName: req.params.name} });

  vld.hasFields(req.body, ['prsId'])
  .then(function() {
    return Promise.all([getPerson, getCourse]);
  })
  .spread(function(person, course) {
    if (!person || !course) {
      return Promise.reject({tag: Tags.notFound});
    }

    return vld.check(prs.isAdmin() || prs.id === req.body.prsId || // Are you Admin, enrolling yourself,
    course.ownerId === prs.id, Tags.noPermission) // or the teacher of this course?
    .then(function() {
      return person.hasClass(course)
    })
    .then(function(alreadyAdded) {
      return vld.check(!alreadyAdded, Tags.dupName);
    })
    .then(function() {
      return person.addClasses([course]);
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

router.get('/:courseName/enrs', getCourseModel, function(req, res) {
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

router.get('/:name/enrs/:enrId', function(req, res) {
  var vld = req._validator;
  var prs = req.session;

  connections.getConnection(res, function(cnn) {
    function getResult(needsIdCheck) {
      var queryArr = [
        'SELECT enrId, whenEnrolled, prsId, lastName, firstName',
        'FROM Enrollment enr INNER JOIN Person p ON p.id = prsId',
        'WHERE enr.enrId = ? AND enr.courseName = ?'
      ];
      cnn.query(queryArr.join(' '), [req.params.enrId, req.params.name], function(err, result) {
        if (vld.check(result && result.length, Tags.notFound) &&
        (!needsIdCheck || vld.check(result[0].prsId === prs.id, Tags.noPermission)))
        res.json(result[0]);

        cnn.release();
      });
    }

    if (prs.isAdmin()) {
      getResult(false);
    }
    else if (prs.isTeacher()) {
      cnn.query('SELECT ownerId FROM Course WHERE name = ?', [req.params.name], function(err, result) {
        if (result && result[0].ownerId === prs.id) {
          getResult(false);
        }
        else
        getResult(true);
      });
    }
    else
    getResult(true);
  });
});

router.delete('/:name/enrs/:enrId', function(req, res) {
  var vld = req._validator;
  var prs = req.session;

  if (vld.checkAdmin()) {
    connections.getConnection(res, function(cnn) {
      function doDelete() {
        cnn.query('DELETE FROM Enrollment WHERE id = ?', [req.params.enrId], function(err, result) {
          res.end();
          cnn.release();
        });
      }

      if (prs.isAdmin()) {
        doDelete();
      }
      else {
        cnn.query('SELECT ownerId FROM Course WHERE name = ?', [req.params.name], function(err, result) {
          if (vld.check(result && result[0].ownerId === prs.id, Tags.noPermission)) {
            doDelete();
          }
          else
          cnn.release();
        });
      }
    });
  }
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

router.middleware = {
   updateStreak: updateStreak
};

module.exports = router;
