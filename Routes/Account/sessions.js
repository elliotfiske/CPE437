var Express = require('express');
var connections = require('../Connections.js');
var Tags = require('../Validator.js').Tags;
var ssnUtil = require('../Session.js');
var router = Express.Router({caseSensitive: false});
var doErrorResponse = require('../Validator.js').doErrorResponse;
var sequelize = require('../sequelize.js');

router.baseURL = '/Ssns';

router.get('/', function(req, res) {
   var vld = req.validator;
   return vld.checkAdmin()
   .then(function() {
      var body = [];
      for (cookie in ssnUtil.sessions) {
         ssn = ssnUtil.sessions[cookie];
         console.log("Session: " + cookie + ' -> ' + ssn);
         body.push({cookie: cookie, prsId: ssn.id, loginTime: ssn.loginTime});
      };
      res.status(200).json(body);
   })
   .catch(doErrorResponse(res));
});

router.post('/', function(req, res) {
   var vld = req.validator;
   return vld.hasFields(req.body, ["email", "password"])
   .then(function() {
      return sequelize.Person.scope(null).findOne({where: {email: req.body.email}});
   })
   .then(function(person) {
      return vld.check(person, Tags.badLogin, null, person, "No user found with that email.");
   })
   .then(function(person) {
      return vld.check(!person.activationToken, Tags.notActivated, null, person, "You need to activate your account! It might take a minute or two for the email to show up. Thank you for your patience!");
   })
   .then(function(person) {
      return vld.check(person.validPassword(req.body.password), Tags.badLogin, null, person, "Incorrect password. Send me an email if you forgot it!");
   })
   .then(function(person) {
      var cookie = ssnUtil.makeSession(person, res);
      res.location(router.baseURL + '/' + cookie).end();
   })
   .catch(doErrorResponse(res));
});

router.delete('/:cookie', function(req, res, next) {
   if (req._validator.check(req.params.cookie === req.cookies[ssnUtil.cookieName]
    || req.session.isAdmin(), Tags.noPermission)) {
       ssnUtil.deleteSession(req.params.cookie);
       res.sendStatus(200);
   }
});

router.get('/:cookie', function(req, res, next) {
   var cookie = req.params.cookie;
   var vld = req._validator;
   if (vld.checkPrsOK(ssnUtil.sessions[cookie].id)) {
      res.json({prsId: req.session.id});
   }
})

module.exports = router;
