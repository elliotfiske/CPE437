var Express = require('express');
var connections = require('../Connections.js');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
router.baseURL = '/Chls';


router.get('/', function(req, res) {
   connections.getConnection(res, function(cnn) {
      cnn.query('SELECT name, description from Challenge', function(err, result) {
         res.json(result);
         cnn.release();
      });
   });
});

router.post('/', function(req, res) {
   if (req.validator.checkAdminOrTeacher() && req.validator.hasFields(req.body, ["name"])) {
      connections.getConnection(res, function(cnn) {
         cnn.query('SELECT * from Challenge where name = ?', req.body.name,
         function(err, result) {
            if (err) {
               console.log(err);
               res.status(500).end();
               cnn.release();
            }
            else if (req.validator.check(!result.length, Tags.dupName)) {
               cnn.query('INSERT INTO Challenge SET ?', req.body, function(err, result) {
                  res.location(router.baseURL + '/' + req.body.name).send(200).end();
                  cnn.release();
               });
            }
            else
               cnn.release();
         });
      });
   }
});

router.get('/:name', function(req, res) {
   connections.getConnection(res, function(cnn) {
      cnn.query('SELECT name, description, attsAllowed from Challenge where name = ?', req.params.name, function(err, result) {
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

router.get('/:name/Atts', function(req, res) {
   connections.getConnection(res, function(cnn) {
      function getResult() {
         var query = 'SELECT id, ? as challengeURI, ownerId, duration, score, startTime, state from Attempt where challengeName = ? ORDER BY startTime DESC';
         var params = ['Chls/' + req.params.name, req.params.name];

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
            if (req.validator.check(result.length, Tags.noPermission)) {
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
