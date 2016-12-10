var Express = require('express');
var Promise = require('bluebird');
var connections = require('./Connections.js');
var sequelize = require('./sequelize.js');
var Tags = require('./Validator.js').Tags;
var doErrorResponse = require('./Validator.js').doErrorResponse;
var router = Express.Router({caseSensitive: false});
router.baseURL = '/peer';

router.get('/hello', function(req, res) {
   res.json({whats: "up"});
})

router.get('/', function(req, res) {
  var vld = req.validator;

  sequelize.PeerId.findAll()
  .then(function(peerList) {
    res.json(peerList);
  })
  .catch(doErrorResponse(res));
});

router.post('/', function(req, res) {
   var vld = req.validator;

   return sequelize.PeerId.create({
      peerid: req.body.peerid,
      name: req.body.name
   })
   .then(function(whatever) {
      res.sendStatus(200);
   })
   .catch(doErrorResponse(res));
});

module.exports = router;
