var Express = require('express');
var Promise = require('bluebird');
var connections = require('./Connections.js');
var sequelize = require('./sequelize.js');
var Tags = require('./Validator.js').Tags;
var doErrorResponse = require('./Validator.js').doErrorResponse;
var router = Express.Router({caseSensitive: false});
var sanitize = require("sanitize-filename");
router.baseURL = '/peer';

var request = require('request');

var headers = {
    'pragma': 'no-cache',
    'origin': 'https://www.messenger.com',
    'accept-encoding': 'gzip, deflate',
    'accept-language': 'en-US,en;q=0.8',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36',
    'content-type': 'application/x-www-form-urlencoded',
    'accept': '*/*',
    'cache-control': 'no-cache',
    'authority': 'www.messenger.com',
    'cookie': 'datr=DLltVk6JfzIkiM7WVNVRunWI; lu=ginOS2ATOSq2HhkTUkfHBu8w; sb=RvoGV0KVimKgGH8BY85lgsdI; s=Aa6cQug_jAzzerwz.BXipBx; p=-2; c_user=1132161073; xs=62%3AeSBemcIZpj8RRg%3A2%3A1468698737%3A13274; csm=2; act=1485472308567%2F0; presence=EDvF3EtimeF1485472345EuserFA21132161073A2EstateFDutF1485472345749CEchFDp_5f1132161073F10CC; wd=720x778',
    'referer': 'https://www.messenger.com/t/1424807301'
};

var dataString = 'emoji_choice=%EMOJI_YO%&thread_or_other_fbid=1424807301&__user=1132161073&__a=1&__dyn=7AzkXh8OAcjxd2u6W85k2m3miWF3oyfJLFwgoqwWhE98nwgUaqG2yaBxebkwy3eF8vDKuEjKewExabwh9UcUtGqexi5UC58OEixu1tyoO6Egx66EK3O69HUlyk6ErKu7F8G4oW2qaxq9zd1O2Knw&__af=i0&__req=m&__be=-1&__pc=PHASED%3Amessengerdotcom_pkg&__rev=2798507&fb_dtsg=AQGZmbWK96tC%3AAQGcybcFQet8&ttstamp=26581719010998877557541166758658171991219899708110111656';

var options = {
    url: 'https://www.messenger.com/messaging/save_thread_emoji/?source=thread_settings&dpr=1',
    method: 'POST',
    headers: headers,
    body: dataString
};

router.get('/emoji/:codepoint', function(req, res) {
   options.body = options.body.replace('%EMOJI_YO%', req.params.codepoint);
   request(options, function(error, response, body) {
      if (!error && response.statusCode == 200) {
          console.log(body);
      }
      else {
         res.json(response);
      }
   });
})

router.get('/', function(req, res) {


   var t = new Date();
   t.setSeconds(t.getSeconds() - 30);

   sequelize.PeerId.findAll()
   .then(function(peerList) {
      peerList = peerList.filter(function(peer) {
         if (peer.lastHeartbeat < t) {
            return false;
         }
         return true;
      });
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

router.get('/heartbeat/:name', function(req, res) {
   sequelize.PeerId.findOne({where: {name: req.params.name}})
   .then(function(peer) {

      var t = new Date();
      t.setSeconds(t.getSeconds() - 30);

      if (peer) {
         if (peer.lastHeartbeat < t) {
            res.sendStatus(400);
         }
         else {
            res.sendStatus(200);
            return peer.updateAttributes({lastHeartbeat: new Date()});
         }
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
   req.params.lastHeartbeat = new Date();

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
