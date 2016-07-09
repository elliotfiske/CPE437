var Express = require('express');
var connections = require('../Connections.js');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
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
               res.json({
                  challengeURI: 'Chls/' + result[0].challengeName,
                  duration: result[0].duration,
                  score: result[0].score,
                  startTime: result[0].startTime,
                  state: result[0].state
               });
            }
         }
         cnn.release();
      });
   });
});

// CAS to JHN: We're not doing 404s.  We should return a 400 using
// validator.  And the cnn needs closing.
router.put('/:attId', function(req, res) {
   var vld = req.validator;

   connections.getConnection(res, function(cnn) {
      cnn.query('select * from Attempt where id = ?', [req.params.attId],
      function(err, result) {
         if (!result.length) {
            res.status(404).send();
            cnn.release();
         }
         else {
            if (vld.checkPrsOK(result[0].ownerId)
             && vld.check(result[0].state !== 1, Tags.attNotClosable)
             && vld.check(result[0].state !== 0, Tags.addClosed)) {
               cnn.query('update Attempt set state = 1 where id = ?', [req.params.attId],
               function(err, result) {
                  res.end(); // failed update?
                  cnn.release();
               });
            }
            else
               cnn.release();
         }
      });
   });
});

router.post("/:attId/Stps", function(req, res) {
   var vld = req.validator;
   var body = req.body;

   if (vld.hasFields(body, ['input']))
      connections.getConnection(res, function(cnn){
         cnn.query('select * from Attempt join Challenge c on challengeName = c.name'
          + ' where id = ?', [req.params.attId],
         function(err, result) {
            result = result.length && result[0];  // Get just first line
            if (vld.check(result, Tags.notFound)
             && vld.checkPrsOK(result.ownerId)
             && vld.check(result.state === 2, Tags.attClosed)) {
               var step = {attemptId: req.params.attId, input: req.body.input}
               cnn.query('insert into Step set ?', step,
               function(err, insResult) {
                  step.id = insResult.insertId;
                  setTimeout(function() {
                     console.log("Work on challenge " + result.name + " stepId " + step.id
                      + " input " + step.input);
                     step.output = JSON.stringify({inputRepeat : step.input});
                     connections.getWorkConnection(
                     function(err, cnn) {
                        if (err)
                           console.log("Error getting cnn to write step to DB");
                        else {
                           cnn.query("update Step set result = ? where id = ?",
                            [step.output, step.id],
                           function(err){
                              if (err)
                                 console.log("Error writing changed step to DB: "
                                  + JSON.stringify(step.output));
                              cnn.release();
                           });
                        }
                     });
                  }, 0);
                  res.location(router.baseURL + '/' + step.attemptId + '/Stps/'
                   + step.id).end();
                  cnn.release();
               });
            }
            else
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
