var Express = require('express');
var connections = require('../Connections.js');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
router.baseURL = '/Crss';

router.post('/', function(req, res) {
   if (req.validator.checkAdminOrTeacher() && req.validator.hasFields(req.body, ["name"])) {
      connections.getConnection(res, function(cnn) {
         cnn.query('SELECT * from Course where name = ?', req.body.name,
         function(err, result) {
            if (err) {
               console.log(err);
               res.status(500).end();
               cnn.release();
            }
            else if (req.validator.check(!result.length, Tags.dupName)) {
               req.body.ownerId = req.session.id;
               cnn.query('INSERT INTO Course SET ?', req.body, function(err, result) {
                  res.location(router.baseURL + '/' + req.body.name).status(200).end();
                  cnn.release();
               });
            }
            else
               cnn.release();
         });
      });
   }
});

router.put('/:name', function(req, res) {
   connections.getConnection(res, function(cnn) {
      if (req.validator.checkAdminOrTeacher()) {
         cnn.query('SELECT * from Course where name = ?', [req.params.name], function(err, result) {
            var ok = req.validator.check(result.length === 1, Tags.notFound);

            if (ok && req.session.isTeacher()) {
               ok = req.validator.check(req.body.ownerId == undefined || req.body.ownerId === result[0].ownerId, Tags.noPermission)
                 && req.validator.check(result[0].ownerId === req.session.id, Tags.noPermission);
            }

            if (ok) {
               cnn.query('SELECT * from Course where name = ?', [req.body.name], function(err, result) {
                  if (req.validator.check(result.length === 0 || req.body.name == undefined, Tags.dupName) &&
                      req.validator.check(req.session.isAdmin() || result)) {
                     cnn.query('UPDATE Course SET ? WHERE name = ?', [req.body, req.params.name], function(err, result) {
                        if (err) {
                           res.status(500).end();
                        }
                        else if (req.validator.check(result.affectedRows, Tags.notFound))
                           res.status(200).end();
                     
                        cnn.release();
                     });
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
      }
   });
});

router.delete('/:name', function(req, res) {
   if (req.validator.checkAdminOrTeacher()) {
      connections.getConnection(res, function(cnn) {
         cnn.query('SELECT * from Course where name = ?', [req.params.name], function(err, result) {
            if (req.validator.check(result.length === 1, Tags.notFound) &&
                req.validator.check(req.session.isAdmin() || req.session.id === result[0].ownerId, Tags.noPermission)) {

               cnn.query('DELETE from Course where name = ?', [req.params.name], function(err, result) {
                  if (err) {
                     res.status(500).end();
                  }
                  else if (req.validator.check(result.affectedRows, Tags.notFound))
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

router.post('/:name/Enrs', function(req, res) {
   var vld = req.validator;
   var prs = req.session;

   connections.getConnection(res, function(cnn) {
      function doEnroll() {
         cnn.query('INSERT INTO Enrollment (prsId, courseName, whenEnrolled) VALUES (?, ?, ?)',
            [req.body.prsId, req.params.name, new Date()], function(err, result) {
            if (err) {
               console.log(err);
               res.status(400).end();
            }
            else {
               res.location(router.baseURL + '/' + req.params.name + '/Enrs/'
                + result.insertId).end();
            }

            cnn.release();
         });
      }

      if (vld.hasFields(req.body, ['prsId'])) {
         if (prs.isAdmin() || prs.id === req.body.prsId) {
            doEnroll();
         }
         else if (vld.check(prs.isTeacher(), Tags.noPermission)) {
            cnn.query('SELECT ownerId FROM Course WHERE name = ?', [req.params.name], function(err, result) {
               if (vld.check(result && result[0].ownerId === prs.id, Tags.noPermission)) {
                  doEnroll();
               }
               else
                  cnn.release();
            });
         }
         else
            cnn.release();
      }
      else
         cnn.release();
   });
});

router.get('/:name/Enrs', function(req, res) {
   var vld = req.validator;
   var prs = req.session;

   if (vld.checkAdminOrTeacher()) {
      connections.getConnection(res, function(cnn) {
         function getResult() {
            var queryArr = [
               'SELECT enrId, whenEnrolled, prsId',
               'FROM Enrollment enr',
               'WHERE enr.courseName = ?'
            ];
            if (req.query.full) {
               queryArr[0] += ', lastName, firstName';
               queryArr[1] += ' INNER JOIN Person p ON p.id = prsId'
            }
            cnn.query(queryArr.join(' '), [req.params.name], function(err, result) {
               res.json(result);
               cnn.release();
            });
         }

         if (prs.isAdmin()) {
            getResult();
         }
         else {
            cnn.query('SELECT ownerId FROM Course WHERE name = ?', [req.params.name], function(err, result) {
               if (vld.check(result && result[0].ownerId === prs.id, Tags.noPermission)) {
                  getResult();
               }
               else
                  cnn.release();
            });
         }
      });
   }
});

router.get('/:name/Enrs/:enrId', function(req, res) {
   var vld = req.validator;
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

router.delete('/:name/Enrs/:enrId', function(req, res) {
   var vld = req.validator;
   var prs = req.session;

   if (vld.checkAdminOrTeacher()) {
      connections.getConnection(res, function(cnn) {
         function doDelete() {
            cnn.query('DELETE FROM Enrollment WHERE enrId = ?', [req.params.enrId], function(err, result) {
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

module.exports = router;
