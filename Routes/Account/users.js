var Express = require('express');
var connections = require('../Connections.js');
var ssnUtil = require('../Session.js');
var Tags = require('../Validator.js').Tags;
var doErrorResponse = require('../Validator.js').doErrorResponse;
var router = Express.Router({caseSensitive: false});
var PromiseUtil = require('../PromiseUtil.js');
var Promise = require('bluebird');
var email = require('../../Notifications/emailSender.js');
var sequelize = require('../sequelize.js');
var middleware = require('../middleware.js');
var request = require("request-promise");

router.baseURL = '/prss';

function sendResult(res, status) {
  return function(result) {
    res.status(status || 200).json(result);
  }
}

router.post('/validateticket', function(req, res) {
   var ticket = req.body.ticket;
   var vld = req.validator;

   var options = {
      method: 'GET',
      uri: 'https://users.csc.calpoly.edu/~efiske/login.php?validateticket=' + ticket,
      resolveWithFullResponse: true    //  <---  <---  <---  <---
   };

   request(options).then(function (response) {
      console.log("Body: ", JSON.stringify(response));
      splitResponse = response.body.split("\n");
      return vld.check(splitResponse[0] === "yes", Tags.noPermission, null, splitResponse[1], "There's something wrong with Cal Poly's servers! I'll check it out..");
   })
   .then(function(email) {
      // OK, now we have to make a session for the user and junk
      return sequelize.Person.findOne({where: {email: email}}).then(function(person) {
         if (!person) {
            return sequelize.Person.create({email: email, role: 0});
         }
         else {
            return Promise.resolve(person);
         }
      });
   })
   .then(function(person) {
      var cookie = ssnUtil.makeSession(person, res);
      res.location(router.baseURL + '/' + cookie).json({email: person.email}).end();
   })
   .catch(doErrorResponse(res));
});

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

// Get how committed one person is
router.get('/commitment', function(req, res) {
   var vld = req.validator;
   return sequelize.do.query("SELECT COUNT(DISTINCT DATE_FORMAT(createdAt, '%c %d %Y')) FROM Attempt WHERE personId = :pid;", {
      replacements: { pid: req.session.id }, type: sequelize.do.QueryTypes.SELECT
   }).then(function(commitment) {
      console.log()
      var result = commitment[0]["COUNT(DISTINCT DATE_FORMAT(createdAt, '%c %d %Y'))"];
      res.json(result);
   })
   .catch(doErrorResponse(res));
});

router.post('/', function(req, res) {
   var vld = req.validator;  // Shorthands
   var body = req.body;
   var admin = req.session && req.session.isAdmin();
   var className = req.body.className || "a class";

   if (admin) {
      console.log("I am admin jah");
      if (req.body.forcePeasant) {
         admin = false;
      }
   }

   if (!admin) {
      // delete body.password; // we have them make a password at activation time now
   }

   delete body.activationToken; // Don't even try it
   delete body.checkedDisclaimer;

   // return vld.checkAdminOrTeacher()
   return vld.check(true)
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
         return newGuy.update({activationToken: null, checkedDisclaimer: 1});
      }
      else {
         return Promise.resolve(newGuy);
      }
   })
   .then(function(result) {
      res.location(router.baseURL + '/' + result.id).json({email: result.email, id: result.id}).end();

      console.log("PERSON FAM: " + JSON.stringify(result));

      // Send activation email
      var subject = "Activate your account on Commit!";
      var body = "Welcome to Commit! Click on the link below to get started. I hope you enjoy using my app :)";
      var link = email.BASE_URL + "#/activation?token=" + result.activationToken;
      var textPreview = "Welcome to Commit! Click on this link to get started. I hope you enjoy using my app :) " + link;

      if (!admin) {
         email.sendEmail(subject, body, link, "Activate!", textPreview, result);
      }
   })
   .catch(doErrorResponse(res));
});

router.get('/:id', function(req, res) {
   var vld = req.validator;

   return vld.checkPrsOK(req.params.id)
   .then(function() {
      return sequelize.Person.findById(req.params.id);
   })
   .then(function(person) {
      return vld.check(person, Tags.badValue, null, person, "You don't exist in the database???");
   })
   .then(function(person) {
      var result = {
         id: person.id,
         email: person.email,
         createdAt: person.created,
         role: person.role,
         checkedDisclaimer: person.checkedDisclaimer
      }

      return sequelize.do.query("SELECT COUNT(DISTINCT DATE_FORMAT(createdAt, '%c %d %Y')) FROM Attempt WHERE personId = :pid;", {
         replacements: { pid: req.params.id }, type: sequelize.do.QueryTypes.SELECT
      }).then(function(dumbObject) {
         var commitment = dumbObject[0]["COUNT(DISTINCT DATE_FORMAT(createdAt, '%c %d %Y'))"];
         result.commitment = commitment;
      })
      .then(function() {
         res.json(result);
      });
   })
   .catch(doErrorResponse(res));
});

router.post('/activate', function(req, res) {
   var vld = req.validator;

   return vld.hasFields(req.body, ["token", "checkedDisclaimer"])
   .then(function() {
      return vld.check(req.body.checkedDisclaimer, Tags.noTerms, null, null, "Please accept the disclaimer to continue!");
   })
   .then(function() {
      // return sequelize.Person.findOne({where:
      //    {activationToken: req.body.token}
      // });
      return sequelize.Person.findById(req.session.id);
   })
   .then(function(person) {
      // return vld.check(person, Tags.badLogin, null, person, "Incorrect token...");
      return vld.check(person, Tags.badLogin, null, person, "Incorrect token...");
   })
   .then(function(person) {
      return person.update({activationToken: null, checkedDisclaimer: 1});
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
      var commitFinder = sequelize.do.query("SELECT COUNT(DISTINCT DATE_FORMAT(createdAt, '%c %d %Y')) FROM Attempt WHERE personId = :pid;", {
         replacements: { pid: req.session.id }, type: sequelize.do.QueryTypes.SELECT
      });

      return Promise.all([enrollments, ownedClasses, commitFinder]);
   })
   .spread(function(enrolled, owned, commitment) {
      var userCommitment = commitment[0]["COUNT(DISTINCT DATE_FORMAT(createdAt, '%c %d %Y'))"];
      res.json({enrolled: enrolled, owned: owned, commitment: userCommitment}).end();
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
