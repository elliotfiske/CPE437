var Express = require('express');
var connections = require('../Connections.js');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var doErrorResponse = require('../Validator.js').doErrorResponse;
var sequelize = require('../sequelize.js');
var Promise = require('bluebird');
router.baseURL = '/chls';

function sendResult(res, status) {
  return function(result) {
    res.status(status || 200).json(result);
  }
}

function releaseConn(conn) {
   return function() {
      conn.release();
   }
}

// Get only OPEN challenges
router.get('/', function(req, res) {
   req.validator.check(!!req.query.prsId, 'noPrsId')
      .then(function() {
        sequelize.Challenge.findAll()

      //    return connections.getConnectionP();
      // })
      // .then(function(conn) {
      //    var query = [
      //       'SELECT name, description, attsAllowed, openTime, prsId from Challenge chl',
      //       'LEFT JOIN Enrollment enr ON enr.courseName = chl.courseName',
      //       'WHERE openTime <= NOW() AND prsId = ?'
      //    ];
      //    var params = [req.query.prsId];
      //
      //    conn.query(query.join(' '), params)
      //       .then(sendResult(res))
      //       .finally(releaseConn(conn));
      })
      .catch(doErrorResponse(res));
});

router.post('/', function(req, res) {
  var vld = req.validator;

  vld.checkAdminOrTeacher()
  .then(function() {
    return vld.hasFields(req.body, ["name", "description", "courseName", "type", "answer", "openTime"]);
  })
  .then(function() {
    if (req.body["type"] === "multchoice") {
      console.log(req.body);
      return vld.check(req.body["choices"] && Array.isArray(req.body["choices"]), Tags.badValue);
    }
    else if (req.body["type"] === "number") {
      return vld.check(parseInt(req.body["answer"]));
    }
  })
  .then(function() {
    return sequelize.Course.findOne({
      where: {name: req.body["courseName"]}
    });
  })
  .then(function(course) {
    delete req.body["courseName"];
    return vld.check(course, Tags.notFound, null, course);
  })
  .then(function(course) {
  console.log(JSON.stringify(course));
    return vld.checkPrsOK(course.ownerId, course);
  })
  .then(function(course) {
    var makeChallenge = sequelize.Challenge.create(req.body);
    var promiseList = [makeChallenge];

    if (req.body["type"] === "multchoice") {
      for (var ndx = 0; ndx < req.body["choices"].length; ndx++) {
        var answerText = req.body["choices"][ndx];
        var answer = sequelize.MultChoiceAnswer.create({index: ndx, text: answerText});
        promiseList.push(answer);
      }
    }

    return Promise.all(promiseList)
    .then(function(arr) {
      console.log(JSON.stringify(arr));
      var newChallenge = arr[0];
      var choices = arr.slice(1);

      var addChlToCourse = course.addChallenges([newChallenge]);
      var addChoicesToChl = newChallenge.addPossibilities(choices);

      return Promise.all([addChlToCourse, addChoicesToChl]);
    })
    .then(function() {
      res.location(router.baseURL + '/' + req.body.name).sendStatus(200).end();
    });
  })
  .catch(doErrorResponse(res));
});


router.get('/:name', function(req, res) {
   connections.getConnection(res, function(cnn) {
      cnn.query('SELECT name, description, attsAllowed, openTime from Challenge where name = ?', req.params.name, function(err, result) {
         if (result.length === 1) {
            res.json(result[0]);
         }
         else {
            res.status(404).send();
         }
         cnn.release();
      });
   });
});

router.get('/:name/atts', function(req, res) {
   connections.getConnection(res, function(cnn) {
      function getResult() {
         var query = 'SELECT id, ? as challengeURI, ownerId, duration, score, startTime, state from Attempt where challengeName = ? ORDER BY startTime DESC';
         var params = ['chls/' + req.params.name, req.params.name];

         if (req.query.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(req.query.limit));
         }

         cnn.query(query, params, function(err, result) {
            res.json(result);
            cnn.release();
         });
      }

      if (req.session.isAdmin()) {
         getResult();
      }
      else {
         cnn.query('SELECT * FROM Attempt WHERE challengeName = ? AND ownerId = ?', [req.params.name, req.session.id], function(err, result) {
            if (req._validator.check(result.length, Tags.noPermission)) {
               getResult();
            }
            else {
               cnn.release();
            }
         });
      }
   });
});

module.exports = router;
