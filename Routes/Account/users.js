var Express = require('express');
var connections = require('../Connections.js');
var Tags = require('../Validator.js').Tags;
var doErrorResponse = require('../Validator.js').doErrorResponse;
var router = Express.Router({caseSensitive: false});
var PromiseUtil = require('../PromiseUtil.js');
var Promise = require('bluebird');
var email = require('../../Notifications/emailSender.js');
var sequelize = require('../sequelize.js');
var middleware = require('../middleware.js');

router.baseURL = '/prss';

function sendResult(res, status) {
  return function(result) {
    res.status(status || 200).json(result);
  }
}

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
   var className = req.body.className || "a class";

   if (admin) {
      if (req.body.forcePeasant) {
         admin = false;
      }
   }

   if (!admin) {
      delete body.password; // we have them make a password at activation time now
   }

   return vld.checkAdminOrTeacher()
   .then(function() {
      return vld.hasFields(body, ["email", "role"]);
   })
   .then(function() {
      return vld.check(body.role == 0 || admin, Tags.noPermission);
   })
   .then(function() {
      return vld.check(body.role >= 0 && body.role < 3, Tags.badValue, ["role"]);
   })
   .then(function() {
      return vld.check(body.email.endsWith("@calpoly.edu") || admin, Tags.badValue, ["email"], null, "You must use a Cal Poly email address.");
   })
   .then(function() {
      return sequelize.Person.findOne({where: {email: body.email}});
   })
   .then(function(existingPerson) {
      return vld.check(!existingPerson, Tags.dupEmail, null, null, "There's already a user with that email!");
   })
   .then(function() {
      return sequelize.Person.create(req.body);
   })
   .then(function(newGuy) {
      if (admin) {
         return newGuy.update({activationToken: null});
      }
      else {
         return Promise.resolve(newGuy);
      }
   })
   .then(function(result) {
      res.location(router.baseURL + '/' + result.id).json({email: result.email, id: result.id}).end();

      console.log("PERSON FAM: " + JSON.stringify(result));

      // Send activation email
      var subject = "You've been added to " + className + " on Commit!";
      var body = "Welcome to Commit! Click on the link below to get started. I hope you enjoy using my app :)";
      var link = email.BASE_URL + "#/activation/?token=" + result.activationToken;
      var textPreview = "Welcome to Commit! Click on this link to get started. I hope you enjoy using my app :) " + link;

      if (!admin) {
         email.sendEmail(subject, body, link, "Activate!", textPreview, result);
      }
   })
   .catch(doErrorResponse(res));
});

router.get('/:id', function(req, res) {
  var vld = req._validator;

  if (vld.checkPrsOK(req.params.id)) {
    connections.getConnection(res, function(cnn) {
      cnn.query('select id, email, name, createdAt, role from Person where id = ?', [req.params.id], function(err, prsArr) {
        if (vld.check(prsArr.length, Tags.notFound)) {
          res.json(prsArr);
        }
        cnn.release();
      });
    });
  }
});

router.post('/activate/:token', function(req, res) {
   var vld = req.validator;  // Shorthands
   return vld.hasFields(req.body, ["password"])
   .then(function() {
      return sequelize.Person.findOne({where:
         {activationToken: req.params.token}
      });
   })
   .then(function(person) {
      return vld.check(person, Tags.badLogin, null, person, "Incorrect token...");
   })
   .then(function(person) {
      return person.update({activationToken: null, password: req.body.password});
   })
   .then(function(person) {
      res.sendStatus(200);
   })
   .catch(doErrorResponse(res));
});

router.put('/:id', function(req, res) {
  var vld = req.validator;
  var body = req.body;
  var admin = req.session.isAdmin();

  // Validation
  return vld.checkPrsOK(req.params.id)
  .then(function() {
    return vld.check(!body.role || admin, Tags.noPermission);
  })
  .then(function() {
    return vld.check(body.password === undefined || body.oldPassword || admin, Tags.noOldPwd);
  })
  .then(function() {
    // Get connection
    return connections.getConnectionP();
  })
  .then(function(conn) {

    // Run queries
    return conn.query('SELECT * FROM Person WHERE id = ?', [req.params.id, body.oldPassword])
    .then(function(result) {
      return vld.check(body.password === undefined || result[0].password === body.oldPassword || admin, Tags.oldPwdMismatch);
    })
    .then(function() {

      // Update the person object
      delete body.oldPassword;
      return conn.query('Update Person SET ? WHERE id = ?', [body, req.params.id]);
    })
    .then(sendResult(res))
    .finally(function() {
      conn.release();
    });
  })
  .catch(doErrorResponse(res));
});

// If teacher, returns list of courses OWNED by teacher.
router.get('/:id/crss', function(req, res) {
  var query, qryParams;

  if (req._validator.checkAdminOrTeacher()) {
    query = 'SELECT * from Course where ownerId = ?';
    params = [req.params.id];

    connections.getConnection(res, function(cnn) {
      cnn.query(query, params, function(err, result) {
        res.json(result);

        cnn.release();
      });
    });
  }
});

// TODO: update streak here
router.get('/:id/enrs', function(req, res) {
   var vld = req.validator;

   return vld.checkPrsOK(req.params.id)
   .then(function() {
      return sequelize.Person.findById(req.params.id);
   })
   .then(function(me) {
      var enrollments = me.getClasses();
      var ownedClasses = sequelize.Course.findAll({where: {ownerId: req.session.id}});

      return Promise.all([enrollments, ownedClasses]);
   })
   .spread(function(enrolled, owned) {
      res.json({enrolled: enrolled, owned: owned}).end();
   })
   .catch(doErrorResponse(res));
});

router.get('/:id/atts', function(req, res) {
  var query, qryParams;

  if (req._validator.checkPrsOK(req.params.id))
  query = 'SELECT * from Attempt where ownerId = ?';
  params = [req.params.id];
  if (req.query.challengeName) {
    query += ' and challengeName = ?';
    params.push(req.query.challengeName);
  }

  connections.getConnection(res, function(cnn) {
    cnn.query(query, params, function(err, result) {
      res.json(result);

      cnn.release();
    });
  });
});

module.exports = router;
