var Express = require('express');
var connections = require('../Connections.js');
var Tags = require('../Validator.js').Tags;
var doErrorResponse = require('../Validator.js').doErrorResponse;
var router = Express.Router({caseSensitive: false});
var PromiseUtil = require('../PromiseUtil.js');
var sequelize = require('../sequelize.js');

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

  if (admin && !body.password)
  body.password = "*";                       // Blocking password

  return vld.hasFields(body, ["email", "name", "role", "password"])
  .then(function() {
    return vld.check(body.role == 0 || admin, Tags.noPermission);
  })
  .then(function() {
    return vld.check(body.role >= 0 && body.role < 3, Tags.badValue, ["role"]);
  })
  .then(function() {
    return connections.getConnectionP();
  })
  .then(function(conn) {

    return conn.query('SELECT * FROM Person WHERE email = ?', [body.email])
    .then(function(collidingEmailPerson) {
      return vld.check(collidingEmailPerson.length == 0, Tags.dupEmail);
    })
    .then(function() {
      return sequelize.Person.create(req.body);
    })
    .then(function(result) {
      res.location(router.baseURL + '/' + result.id).end();
    })
    .finally(function() {
      conn.release();
    })
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

router.delete('/:id', function(req, res) {
  var vld = req._validator;

  if (vld.checkAdmin())
  connections.getConnection(res, function(cnn) {
    cnn.query('DELETE from Person where id = ?', [req.params.id], function (err, result) {
      if (vld.check(result.affectedRows, Tags.notFound))
      res.end();
      cnn.release();
    });
  });
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

router.get('/:id/enrs', function(req, res) {
  var vld = req.validator;

  return vld.checkPrsOK(req.params.id)
  .then(function() {
    return sequelize.Person.findById(req.params.id);
  })
  .then(function(me) {
    return me.getClasses();
  })
  .then(function(classes) {
    res.json(classes).end();
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
