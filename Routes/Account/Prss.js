var Express = require('express');
var connections = require('../Connections.js');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var PromiseUtil = require('../PromiseUtil.js');

router.baseURL = '/Prss';

router.get('/', function(req, res) {
   var specifier = req.query.email || !req.session.isAdmin() && req.session.email;

   connections.getConnection(res, function(cnn) {
      var handler = function(err, prsArr) {
         res.json(prsArr);
         cnn.release();
      }

      if (specifier)
         cnn.query('select id, email from Person where email = ?',
          [specifier], handler);
      else
         cnn.query('select id, email from Person', handler);
   });
});

router.post('/', function(req, res) {
   var vld = req.validator;  // Shorthands
   var body = req.body;
   var admin = req.session && req.session.isAdmin();

   if (admin && !body.password)
      body.password = "*";                       // Blocking password
   body.whenRegistered = new Date();

   // This chain seems like it will always return the last test, not false if any fail
   // This can be seen by an attempt to post an admin with no AU
   if (vld.hasFields(body, ["email", "lastName", "role", "password"])
    && vld.chain(body.role == 0 || admin, Tags.noPermission)
    .check(body.role >= 0 && body.role < 3, Tags.badValue, ["role"])
    && vld.check(body.termsAccepted || admin, Tags.noTerms)) {
      connections.getConnection(res,
      function(cnn) {
         cnn.query('SELECT * from Person where email = ?', body.email,
         function(err, result) {
            if (req.validator.check(!result.length, Tags.dupEmail)) {
               body.termsAccepted = new Date();
               cnn.query('INSERT INTO Person SET ?', body,
               function(err, result) {
                  if (err)
                     res.status(500).json(err);
                  else
                     res.location(router.baseURL + '/' + result.insertId).end();
                  cnn.release();
               });
            } else
               cnn.release();
         });
      });
   }
});

router.get('/:id', function(req, res) {
   var vld = req.validator;

   if (vld.checkPrsOK(req.params.id)) {
      connections.getConnection(res,
      function(cnn) {
         cnn.query('select id, email, firstName, lastName, whenRegistered, role, termsAccepted from Person where id = ?', [req.params.id],
         function(err, prsArr) {
            if (vld.check(prsArr.length, Tags.notFound))
               res.json(prsArr);
            cnn.release();
         });
      });
   }
});

router.put('/:id', function(req, res) {
  var vld = req.validator;
  var body = req.body;
  var admin = req.session.isAdmin();

  if (!vld.checkPrsOK(req.params.id)) { // AU == person being edited
    return;
  }

  if (!vld.chain(!body.role || admin, Tags.noPermission) // Check fields
  .check(body.password === undefined || body.oldPassword || admin, Tags.noOldPwd)) {
    return;
  }

  var cnn;

  connections.getConnectionP().then(function(res) {
    cnn = res;
    return cnn.query('SELECT * FROM Person WHERE id = ?', [req.params.id, body.oldPassword]);
  })
  .then(function(res) {
    if (res[0].password === body.oldPassword || admin) { // verify old pwd
      delete body.oldPassword;
      return cnn.query('Update Person SET ? WHERE id = ?', [body, req.params.id]);
    }
    else {
      return PromiseUtil.Error(400, Tags.oldPwdMismatch)
    }
  })
  .then(function(res) {
    res.status(200).end();
  })
  .catch(function(err) {
    if (!err.statusCode)
      err.statusCode = 400;
    res.status(err.statusCode).json(err.message);
  })
  .finally(function() {
    if (cnn)
      cnn.release();
  });
});

router.putid_OLD_WAY = function(req, res) {
   var vld = req.validator;
   var body = req.body;
   var admin = req.session && req.session.isAdmin();

   if (vld.checkPrsOK(req.params.id)
    && vld.check(body.role === undefined || admin, Tags.noPermission)
    && vld.check(body.password === undefined || body.oldPassword || admin, Tags.noOldPwd)) {
      connections.getConnection(res,
      function(cnn) {
         cnn.query('SELECT * FROM Person WHERE id = ?', [req.params.id, body.oldPassword],
         function(err, prsArr) {
            if (err) {
               res.status(500).end();
               cnn.release();
            }
            else if (vld.check(prsArr[0].password === body.oldPassword || admin, Tags.oldPwdMismatch)) {
               delete body.oldPassword;
               cnn.query('Update Person SET ? WHERE id = ?', [body, req.params.id],
               function(err, prsArr) {
                  if (err) {
                     res.status(500).end();
                  }
                  else if (vld.check(prsArr.affectedRows, Tags.notFound))
                     res.status(200).end();

                  cnn.release();
               });
            }
            else
               cnn.release();
         });
      });
   }
};

router.delete('/:id', function(req, res) {
   var vld = req.validator;

   if (vld.checkAdmin())
      connections.getConnection(res, function(cnn) {
         cnn.query('DELETE from Person where id = ?', [req.params.id],
         function (err, result) {
            if (vld.check(result.affectedRows, Tags.notFound))
               res.end();
            cnn.release();
         });
      });
});

router.get('/:id/Crss', function(req, res) {
   var query, qryParams;

   if (req.validator.checkPrsOK(req.params.id))
      query = 'SELECT * from Course where ownerId = ?';
      params = [req.params.id];

      connections.getConnection(res,
      function(cnn) {
         cnn.query(query, params,
         function(err, result) {
            res.json(result);

            cnn.release();
         });
      });
});

router.get('/:id/Atts', function(req, res) {
   var query, qryParams;

   if (req.validator.checkPrsOK(req.params.id))
      query = 'SELECT * from Attempt where ownerId = ?';
      params = [req.params.id];
      if (req.query.challengeName) {
         query += ' and challengeName = ?';
         params.push(req.query.challengeName);
      }

      connections.getConnection(res,
      function(cnn) {
         cnn.query(query, params,
         function(err, result) {
            res.json(result);

            cnn.release();
         });
      });
});

router.post('/:id/Atts', function(req, res) {
   var vld = req.validator;
   var chlName = req.body.challengeName;
   var owner = req.params.id;
   var chl;

   if (vld.chain(chlName, Tags.missingField, ['challengeName']).checkPrsOK(owner)) {
      connections.getConnection(res,
      function(cnn) {
         cnn.query('select * from Challenge where name = ?', [chlName],
         function(err, result) {
            if (vld.check(result.length, Tags.badChlName)) {
               chl = result[0];
               cnn.query('SELECT * from Attempt where state = 2 and ownerId = ? '
                + 'and challengeName = ?',  [owner, chlName],
               function(err, result) {
                  if (vld.check(result.length === 0, Tags.incompAttempt)) {
                     cnn.query('SELECT * from Attempt where ownerId = ? '
                      + 'and challengeName = ?',  [owner, chlName],
                     function(err, result) {
                        if (vld.check(result.length < chl.attsAllowed, Tags.excessAtts)) {
                           var attempt = {
                              ownerId: owner,
                              challengeName: chlName,
                              duration: 0,
                              score: -1,
                              startTime: new Date(),
                              state: 2
                           };
                           cnn.query('INSERT INTO Attempt SET ?', attempt,
                           function(err, result) {
                              res.location(router.baseURL + '/' + owner + '/Atts/'
                               + result.insertId).end();
                              cnn.release();
                           });
                        }
                        else  // Att count exceeded
                           cnn.release();
                     });
                  }
                  else // Active att was found
                     cnn.release();
               });
            }
            else // Challenge name was bad
               cnn.release();
         });
      });
   }
});

module.exports = router;
