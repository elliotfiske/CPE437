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
   if (req.validator.checkAdmin() && req.validator.hasFields(req.body, ["name"])) {
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
                  res.location(router.baseURL + '/' + result.insertId).send(200).end();
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
      cnn.query('SELECT description, attsAllowed from Challenge where name = ?', req.params.name, function(err, result) {
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



module.exports = router;
