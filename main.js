var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var passport = require('./Database/passport');

var bodyParser = require('body-parser');
var Session = require('./Routes/Session.js');
var Validator = require('./Routes/Validator.js');
var _Validator = require('./Routes/_Validator.js');
var cnnPool = require('./Routes/Connections.js');

var async = require('async');

var app = express();

// Static paths to be served like index.html and all client side js
app.use(express.static(path.join(__dirname, 'public')));

// Parse all request bodies using JSON
app.use(bodyParser.json());

// Attach cookies to req as req.cookies.<cookieName>
app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());

// Set up Session on req if available
app.use(Session.router);

app.use(function(req, res, next) {
   req.validator = new Validator(req, res);
   req._validator = new _Validator(req, res);

   console.log(req.method, req.path);

  //  if (req.session || (req.method === 'POST' &&
  //   (req.path === '/Prss' || req.path === '/Ssns')))
      next();
  //  else
      // res.status(401).json([{tag: Validator.Tags.noLogin}]);

});

app.use('/Prss', require('./Routes/Account/Prss'));
app.use('/Ssns', require('./Routes/Account/Ssns'));
app.use('/Chls', require('./Routes/Challenge/Chls'));
app.use('/Atts', require('./Routes/Challenge/Atts'));
app.use('/Crss', require('./Routes/Course/Crss'));

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));


app.delete('/DB', function(req, res) {

   cnnPool.getConnection(res, function(cnn) {
      async.series([
         function(callback){
            cnn.query('delete from Attempt', callback);
         },
         function(callback){
            cnn.query('delete from Challenge', callback);
         },
         function(callback){
            cnn.query('delete from Person', callback);
         },
         function(callback){
            cnn.query('delete from Course', callback);
         },
         function(callback){
            cnn.query('delete from Enrollment', callback);
         },
         function(callback){
            cnn.query('delete from StudentPurchase', callback);
         },
         function(callback){
            cnn.query('delete from ShopItem', callback);
         },
         function(callback){
            cnn.query('alter table Attempt auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('alter table Person auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('alter table Enrollment auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('alter table ShopItem auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('alter table StudentPurchase auto_increment = 1', callback);
         },
         function(callback){
            cnn.query('INSERT INTO Person (id, firstName, lastName, email,' +
                ' password, whenRegistered, termsAccepted, role) VALUES (' +
                '1, "Admin", "IAM", "Admin@11.com","password", NOW(), NOW(), 2);'
            , callback);
         },
         function(callback){
            for (var session in Session.sessions)
               delete Session.sessions[session];
            res.send();
         }
      ],
      function(err, status) {
         console.log(err);

         res.end(500);
      }
   );
   cnn.release();
   });
});

/* Testing Material */
app.get('/test', function(req, res) {
   console.log("In test route");
   res.status(200).end();
});

var sbCounter = 0;

app.get('/slowboat', function(req, res, next) {
   console.log("In slowboat route");
   setTimeout(function(){
      console.log("Slowboat hit done");
      res.status(200).json(sbCounter++);
   }, 5000);
   console.log("Done with route");
});

// Messing around with a simple route and with mysql
app.get('/data', function (req, res, next) {
   cnnPool.getConnection(res, function(cnn) {
      cnn.query('Select * from Person', function (err, data) {
         //cnn.release();
         res.status(200).json(data);
      });
   });
   console.log('Done setting up /data query');
});

app.use(function(err, req, res, next) {
   console.error(err.stack);
   res.status(500).send('error', {error: err});
});

app.listen(process.env.OPENSHIFT_NODEJS_PORT || process.env.NODE_PORT || 3000,
           process.env.OPENSHIFT_NODEJS_IP   || process.env.NODE_IP   || 'localhost',
function () {
   console.log('App Listening on port 3000');
});
