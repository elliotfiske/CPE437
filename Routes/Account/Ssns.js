var Express = require('express');
var connections = require('../Connections.js');
var Tags = require('../Validator.js').Tags;
var ssnUtil = require('../Session.js');
var router = Express.Router({caseSensitive: true});

router.baseURL = '/Ssns';

router.get('/', function(req, res) {
   var body = [], ssn;

   if (req.validator.checkAdmin()) {
      for (cookie in ssnUtil.sessions) {
         ssn = ssnUtil.sessions[cookie];
         console.log("Session: " + cookie + ' -> ' + ssn);
         body.push({cookie: cookie, prsId: ssn.id, loginTime: ssn.loginTime});
      };
      res.status(200).json(body);
   }
});

router.post('/', function(req, res) {
   var cookie;

   connections.getConnection(res, function(cnn) {
      cnn.query('SELECT * from Person where email = ?', [req.body.email], function(err, result) {
         if (req.validator.check(result.length && result[0].password === req.body.password && result[0].password !== '*', Tags.badLogin)) {
            cookie = ssnUtil.makeSession(result[0], res);
            res.location(router.baseURL + '/'  + cookie).end();
         }
         cnn.release();
      });
   });
});

router.delete('/:cookie', function(req, res, next) {
   if (req.validator.check(req.params.cookie === req.cookies[ssnUtil.cookieName]
    || req.session.isAdmin(), Tags.noPermission)) {
       ssnUtil.deleteSession(req.params.cookie);
       res.sendStatus(200);
   }
});

module.exports = router;
