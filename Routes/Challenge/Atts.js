var Express = require('express');
var connections = require('../Connections.js');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');
router.baseURL = '/Atts';

router.get('/:attId', function(req, res) {
   var vld = req.validator;

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
               cnn.release();
            }
         }
      });
   });
});

router.put('/:attId', function(req, res) {
   var vld = req.validator;

   connections.getConnection(res, function(cnn) {
      cnn.query('select * from Attempt where id = ?', [req.params.attId],
      function(err, result) {
         if (vld.check(result.length, Tags.notFound)
          && vld.checkPrsOK(result[0].ownerId)
          && vld.check(result[0].state === 2, Tags.attNotClosable)) {
            cnn.query('update Attempt set state = 1 where id = ?', [req.params.attId],
            function(err, result) {
               res.end(); // failed update?
            });
            cnn.release();
         }
      });
   });
});

router.get("/:attId/Stps", function(req, res) {
   var vld = req.validator;
   var attId = req.params.attId;

   connections.getConnection(res,
   function(cnn) {
      async.waterfall([
      function(cb) {
         cnn.query('select * from Attempt where id = ?', attId, cb);
      },
      function(atts, fields, cb) {
         if (vld.checkPrsOK(atts[0].ownerId, cb))
            cnn.query('select * from Step where attemptId = ?', attId, cb);
      },
      function(stps, fields, cb) {
         res.json(stps);
         cb();
      }],
      function(err) {
         if (vld !== err)
            vld.check(!err, Tags.queryFailed, [err]);
         cnn.release();
      })
   });
});

/* Async waterfall version */
router.post("/:attId/Stps", function(req, res) {
   var vld = req.validator;
   var body = req.body;
   var stpInput = req.body.input;
   var attId = req.params.attId;
   var step;

   if (vld.hasFields(body, ['input']))
      connections.getConnection(res,
      function(cnn) {
         async.waterfall([
            function(callback) {
               cnn.query('select * from Attempt join Challenge c on challengeName = c.name'
                + ' where id = ?', [attId], callback);
            },
            function(result, fields, callback) {
               result = result.length && result[0];  // Get just first line
               if (vld.check(result, Tags.notFound, [], callback)
                && vld.checkPrsOK(result.ownerId, callback)
                && vld.check(result.state === 2, Tags.attClosed, Tags.notFound, [], callback)) {
                  step = {attemptId: attId, input: JSON.stringify(stpInput)}
                  cnn.query('insert into Step set ?', step, callback);
               }
            },
            function(insResult, fields, callback) {
               step.id = insResult.insertId;
               res.location(router.BaseURL + '/' + attId + '/Stps/' + step.id).end();
               step.result = JSON.stringify({score: stpInput.score || 'none',
                comment: stpInput.comment || 'n/a'});
               cnn.query("update Step set result = ? where id = ?",
                [step.result, step.id], callback);
            },
            function(res, fields, cb) {
               console.log("Time to update attempt " + attId);
               if (stpInput.score) {
                  cnn.query('update Attempt set score = ?, state = 0 where id = ?',
                   [stpInput.score, attId], cb);
               }
               else
                  cb();
            }],
            function(err) {
               if (vld !== err)
                  vld.check(!err, Tags.queryFailed, [err]);
               else
                  res.end();
               cnn.release();
            });
      });
});

router.get("/:attId/Stps/:stpId", function(req, res) {
   var vld = req.validator;

   connections.getConnection(res, function(cnn) {
      cnn.query('select * from Step s join Attempt a on attemptId = a.id where s.id = ?',
       [req.params.stpId],
      function(err, result) {
         if (vld.check(result.length, Tags.notFound)
          && vld.checkPrsOK(result[0].ownerId))
            res.json({input: result[0].input, result: JSON.parse(result[0].result)});
         cnn.release();
      });
   });
});

module.exports = router;