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

   return vld.checkAdminOrTeacher()
   .then(function() {
      return vld.hasFields(req.body, ["name"]);
   })
   .then(function() {
      return sequelize.Course.findById(req.body.name);
   })
   .then(function(existingCourse) {
      return vld.check(!existingCourse, Tags.dupName, null, null, "There's already a course named " + req.body.name);
   })
   .then(function() {
      return sequelize.Person.findById(req.session.id)
      .then(function(teacher) {
         return sequelize.Course.create({
            name: req.body.name,
            ownerId: req.session.id,
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

router.get('/:courseName', getCourseModel, function(req, res) {
  res.json(req.course);
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

router.get('/:crsName/itms', function(req, res) {
  var vld = req.validator;
  var admin = req.session && req.session.isAdmin();
  var enrolled = false;
  var owner = false;

  connections.getConnection(res, function(cnn) {
    cnn.query('Select * from Enrollment where courseName = ?', req.params.crsName,
    function(err, result) {
      if (result.length) {
        for (var i = 0; i < result.length; i++) {
          if (result[i].prsId === req.session.id)
          enrolled = true;
        }
      }
      cnn.query('Select * from Course where name = ?', req.params.crsName,
      function(err, result) {
        if (result.length) {
          for (var i = 0; i < result.length; i++) {
            if (result[i].ownerId == req.session.id)
            owner = true;
          }
        }
        if (vld.check(enrolled || owner || admin, Tags.noPermission)) {
          cnn.query('Select name, cost, id from ShopItem where courseName = ?', req.params.crsName,
          function(err, result) {
            res.json(result);
            cnn.release();
          });
        }
        else {
          cnn.release();
        }
      });
    });
  });
});

router.post('/:crsName/itms', function(req, res) {
  var vld = req._validator;

  if (vld.hasFields(req.body, ["name", "cost"])) {
    connections.getConnection(res, function(cnn) {
      cnn.query('Select name from ShopItem where name = ?', req.body.name,
      function(err, result) {
        if (vld.check(!result.length, Tags.dupName)) {
          cnn.query('Insert into ShopItem (name, courseName, cost) value (?, ?, ?)',
          [req.body.name, req.params.crsName, req.body.cost],
          function(err, result) {
            if (err)
            res.status(400).json(err);
            else {
              res.location(router.baseURL + '/' + req.params.crsName + '/itms/' + result.insertId).status(200).end();
            }
          });
        }
        else {
          cnn.release();
        }
      });
    });
  }
});

router.put('/:crsName/itms/:itmId', function(req, res) {
  var vld = req._validator;
  var admin = req.session && req.session.isAdmin();
  var owner = false;
  var purchase = false;
  var name = req.body.name;
  var cost = req.body.cost;
  var purchased = req.body.purchased;
  var error = false;

  connections.getConnection(res, function(cnn) {
    cnn.query('Select * from Course where name = ?', req.params.crsName,
    function(err, result) {
      if (vld.check(result && result.length, Tags.notFound)) {
        result = result[0];
        if (result.ownerId === req.session.id)
        owner = true;

        cnn.query('Select * from ShopItem where id = ?', req.params.itmId,
        function(err, result) {
          if (vld.check(result && result.length, Tags.notFound)) {
            purchase = result[0].purchased;

            if (name && !vld.check(admin || owner, Tags.noPermission))
            error = true;
            if (cost && !vld.check(admin || owner, Tags.noPermission))
            error = true;

            if ((purchased !== undefined) && purchased && !vld.check(!purchase || admin || owner, Tags.noPermission))
            error = true;

            if (!error) {
              cnn.query('Update ShopItem set ? where id = ?', [req.body, req.params.itmId],
              function(err) {
                if(err)
                res.status(400).json(err);
                else {
                  res.end();
                }
                cnn.release();
              });
            }
          }
          else {
            cnn.release();
          }
        });
      }
      else {
        cnn.release();
      }
    });
  });
});

router.delete('/:crsName/itms/:itmId', function(req, res) {
  var vld = req.validator;
  var admin = req.session && req.session.isAdmin();

  if (vld.check(admin, Tags.noPermission)) {
    connections.getConnection(res, function(cnn) {
      cnn.query('Delete from ShopItem where id = ?', req.params.itmId,
      function(err, result) {
        res.end();
        cnn.release();
      });
    });
  }
});

module.exports = router;
