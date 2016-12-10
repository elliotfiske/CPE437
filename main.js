var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var passport = require('./Database/passport');
var sequelize = require('./Routes/sequelize');

var bodyParser = require('body-parser');
var Session = require('./Routes/Session.js');
var Validator = require('./Routes/Validator.js');
var _Validator = require('./Routes/_Validator.js');
var cnnPool = require('./Routes/Connections.js');
var sequelize = require('./Routes/sequelize.js');

var async = require('async');


var app = express();

// Static paths to be served like index.html and all client side js
app.use(express.static(path.join(__dirname, 'public')));

// consider all paths as lowercase yo
app.use(function(req, res, next) {
  req.url = req.url.toLowerCase();
  next();
});

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

   // if (req.session || (req.method === 'POST' &&
   //  (req.path === '/prss' || req.path === '/ssns')))
      next();
   // else
   //    res.status(401).json([{tag: Validator.Tags.noLogin}]);

});

app.use('/peer', require('./Routes/peer'));
app.use('/crss', require('./Routes/Course/courses'));
app.use('/prss', require('./Routes/Account/users'));
app.use('/ssns', require('./Routes/Account/sessions'));

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_about_me'] }));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login'}));

app.delete('/DB', function(req, res) {
  return req.validator.checkAdmin()
  .then(function() {
    return sequelize.do.sync({force: true});
  })
  .then(function() {
    return sequelize.Person.findOrCreate({
      where: {email: 'Admin@11.com'},
      defaults: {name: 'AdminMan', password: "password", role: 2}
    });
  })
  .then(function() {
    res.sendStatus(200);
  })
  .catch(function(err) {
    res.status(500).json({error: "OH NO: " + JSON.stringify(err)}).end();
  });
});

/* Testing Material */
app.get('/test', function(req, res) {
   console.log("In test route");
   res.status(200).end();
});

app.use(function(err, req, res, next) {
   console.error(err.stack);
   res.status(500).send('error', {error: err});
});

app.set('port', (process.env.PORT || 3000));

app.listen(process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000,
function () {
   console.log('Node app is running on port', app.get('port'));
});
