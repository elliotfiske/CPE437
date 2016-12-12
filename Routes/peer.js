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

router.post('/id/:peerid/name/:name/color/:color', function(req, res) {
   var vld = req.validator;

   req.params.name = sanitize(req.params.name);
   req.params.name = req.params.name.substring(0, 69);

   console.log("The body sez: " + JSON.stringify(req.params));

   return vld.hasFields(req.params, ['name', 'color', 'peerid'])
   .then(function() {
      return vld.check(/^[0-9A-F]{6}$/i.test(req.params.color), Tags.badValue);
   })
   .then(function() {
      return sequelize.PeerId.create(req.params);
   })
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
         res.json("they don't exist fam");
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
