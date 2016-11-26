var Express = require('express');
var Promise = require('bluebird');
var connections = require('../Connections.js');
var sequelize = require('../sequelize.js');
var Tags = require('../Validator.js').Tags;
var doErrorResponse = require('../Validator.js').doErrorResponse;
var router = Express.Router({caseSensitive: false});
router.baseURL = '/crss';

var challengeRouter = require('./Challenge/challenges.js');
router.use('/:courseName/challenge', challengeRouter);

function handleError(res) {
  return function(error) {
    var code = error.code || 400;
    delete error.code

    res.status(code).json(error);
  }
}

router.get('/', function(req, res) {
  var vld = req.validator;

  sequelize.Course.findAll()
  .then(function(courseList) {
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
    return connections.getConnectionP()
  })
  .then(function(conn) {
    return conn.query('SELECT * FROM Course where name = ?', req.body.name)
    .then(function(courseResult) {
      return vld.check(!courseResult.length, Tags.dupName, {}, courseResult);
    })
    .then(function(courseResult) {
      req.body.ownerId = req.session.id;
      return sequelize.Course.create(req.body); //conn.query('INSERT INTO Course SET ?', req.body);
    })
    .then(function(insertResult) {
      res.location(router.baseURL + '/' + req.body.name).status(200).end();
      return Promise.resolve();
    })
    .finally(function() {
      conn.release();
    });
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

router.delete('/:name', function(req, res) {
  if (req._validator.checkAdminOrTeacher()) {
    connections.getConnection(res, function(cnn) {
      cnn.query('SELECT * from Course where name = ?', [req.params.name], function(err, result) {
        if (req._validator.check(result.length === 1, Tags.notFound) &&
        req._validator.check(req.session.isAdmin() || req.session.id === result[0].ownerId, Tags.noPermission)) {

          cnn.query('DELETE from Course where name = ?', [req.params.name], function(err, result) {
            if (err) {
              res.status(500).end();
            }
            else if (req._validator.check(result.affectedRows, Tags.notFound))
            res.status(200).end();

            cnn.release();
          });
        }
        else {
          cnn.release();
        }
      });
    });
  }
});

router.post('/:name/enrs', function(req, res) {
  var vld = req.validator;
  var prs = req.session;

  var getPerson = sequelize.Person.findById(req.body.prsId);
  var getCourse = sequelize.Course.findOne({ where: {name: req.params.name} });

  vld.hasFields(req.body, ['prsId'])
  .then(function() {
    return Promise.all([getPerson, getCourse]);
  })
  .then(function(arr) {
    var person = arr[0];
    var course = arr[1];

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

router.get('/:name/enrs', function(req, res) {
  var vld = req.validator;
  var prs = req.session;

  sequelize.Course.findOne({
    where: {name: req.params.name},
    include: [{ model: sequelize.Person, as: 'EnrolledDudes', attributes: ['name', 'email'] }]
  })
  .then(function(course) {
    return vld.checkPrsOK(course.ownerId, course);
  })
  .then(function(course) {
    res.json(course["EnrolledDudes"]);
  })
  .catch(handleError(res));
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

router.put('/:name/enrs/:enrId', function(req, res) {
  var vld = req._validator;
  var admin = req.session && req.session.isAdmin();
  var owner = false;
  var enrolled = false;

  connections.getConnection(res, function(cnn) {
    cnn.query('Select * from Course where name = ?', req.params.name,
    function(err, result) {
      if (vld.check(result.length, Tags.notFound)) {
        result = result[0];
        if (result.ownerId === req.session.id)
        owner = true;

        cnn.query('Select * from Enrollment where id = ?', req.params.enrId,
        function(err, result) {
          if (vld.check(result.length, Tags.notFound)) {
            result = result[0];
            if(result.prsId === req.session.id)
            enrolled = true;

            if (vld.check(owner || enrolled || admin, Tags.noPermission)) {
              cnn.query('Update Enrollment set ? where id = ?', [req.body, req.params.enrId],
              function(err, result) {
                res.status(200).end();
                cnn.release();
              });
            }
            else {
              cnn.release();
            }
          }
          else
          cnn.release();
        });
      }
      else
      cnn.release();
    });
  });
});

router.delete('/:name/enrs/:enrId', function(req, res) {
  var vld = req._validator;
  var prs = req.session;

  if (vld.checkAdminOrTeacher()) {
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

  // TODO: change to check if it's an enrolled student
  vld.checkAdminOrTeacher()
  .then(function() {
    return sequelize.Course.findOne({where: {name: req.params.name},
      include: [{model: sequelize.Challenge, as: 'Challenges', attributes: {exclude: ['answer']}}]
    });
  })
  .then(function(chls) {
    res.json(chls["Challenges"]);
  })
  .catch(handleError(res));
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
