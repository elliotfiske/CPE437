var Express = require('express');
var connections = require('../Connections.js');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: false});
var async = require('async');
router.baseURL = '/atts';

router.get('/:attId', function(req, res) {
   var vld = req._validator;

   connections.getConnection(res, function(cnn) {
      cnn.query('select * from Attempt where id = ?', [req.params.attId],
      function(err, result) {
         if (!result.length) {
            res.status(404).send();
         }
         else {
            if (vld.checkPrsOK(result[0].ownerId)) {
               delete result[0].ownerId;
               res.json(result[0]);
            }
         }
         cnn.release();
      });
   });
});

router.put('/:attId', function(req, res) {
   var vld = req._validator;

   connections.getConnection(res, function(cnn) {
      cnn.query('select * from Attempt where id = ?', [req.params.attId],
      function(err, result) {
         if (vld.check(result.length, Tags.notFound)
          && vld.checkPrsOK(result[0].ownerId)
          && vld.check(result[0].state === 2, Tags.attNotClosable)) {
            cnn.query('update Attempt set state = 1 where id = ?', [req.params.attId],
            function(err, result) {
               res.end(); // failed update?
               cnn.release();
            });
         }
         else {
            cnn.release();
         }
      });
   });
});


module.exports = router;