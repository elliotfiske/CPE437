var Express = require('express');
var Promise = require('bluebird');
var connections = require('./Connections.js');
var sequelize = require('./sequelize.js');
var Tags = require('./Validator.js').Tags;
var doErrorResponse = require('./Validator.js').doErrorResponse;
var router = Express.Router({caseSensitive: false});
var sanitize = require("sanitize-filename");
router.baseURL = '/peer';

router.get('/', function(req, res) {
  sequelize.PeerId.findAll()
  .then(function(peerList) {
    res.json(peerList);
  })
  .catch(doErrorResponse(res));
});

router.get('/id/:peerid', function(req, res) {
  sequelize.PeerId.findOne({where: {peerid: req.params.peerid}})
  .then(function(peer) {
    if (peer) {
      res.json(peer["name"]);
   }
   else {
      res.sendStatus(404);
   }
  })
  .catch(doErrorResponse(res));
});

router.post('/id/:peerid/name/:name', function(req, res) {
   var vld = req.validator;

   req.params.name = sanitize(req.params.name);

   console.log("The body sez: " + JSON.stringify(req.params));

   return sequelize.PeerId.create(req.params)
   .then(function(whatever) {
      res.json(req.params.name);
   })
   .catch(doErrorResponse(res));
});

router.delete('/:peerid', function(req, res) {
   return sequelize.PeerId.findOne({
      where:  {peerid: req.params.peerid}
   })
   .then(function(toDelete) {
      if (!toDelete) {
         res.sendStatus(404);
         next();
      }
      else {
         return toDelete.destroy();
      }
   })
   .then(function() {
      res.sendStatus(200);
   })
   .catch(doErrorResponse(res));
});

module.exports = router;
