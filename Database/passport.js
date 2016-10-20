var passport = require('passport');

// These are different types of authentication strategies that can be used with Passport.
// var LocalStrategy = require('passport-local').Strategy;
// var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
// var GoogleStrategy = require('passport-google').Strategy;
var config = require('./developmentKeys');

//Serialize sessions
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, req, done) {
  connections.getConnection(res, function(cnn) {
      cnn.query('select * from Person where id = ?', [id], function(err, result) {
      }
    }
    db.User.find({where: {id: id}}).then(function(user){
        if(!user){
            console.error('Logged in user not in database, user possibly deleted post-login');
            return done(null, false);
        }
        console.log('Session: { id: ' + user.id + ', username: ' + user.email + ' }');
        done(null, user);
    }).catch(function(err){
        done(err, null);
    });
});

// Use facebook strategy
passport.use(new FacebookStrategy({
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL: config.facebook.callbackURL
    },
    // Whatever you pass into the second argument of done() will be available as
    //  req.user
    function(accessToken, refreshToken, profile, done) {
        console.log("Here we go: atok: " + accessToken + " reftok: " + refreshToken + " profile: " + JSON.stringify(profile));
        done(null, {test: "this"});
    }
));

module.exports = passport;
