var passport = require('passport');
var connections = require('../Routes/Connections.js');
var Tags = require('../Routes/Validator.js').Tags;

// These are different types of authentication strategies that can be used with Passport.
// var LocalStrategy = require('passport-local').Strategy;
// var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
// var GoogleStrategy = require('passport-google').Strategy;

var onHeroku = !!process.env.DYNO;
if (!onHeroku) {
  var config = require('./developmentKeys');
}
else {
  config = {
    facebook: {
      clientID: process.env.FACEBOOK_CLIENTID,
      clientSecret: process.env.FACEBOOK_CLIENTSECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK
    }
  }
}

//Serialize sessions
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, req, done) {
  var vld = req.validator;

  connections.getConnectionP()
  .then(function(conn) {

    return conn.query('SELECT * FROM Person WHERE id = ?', [req.params.id])
      .then(function(userResult) {
        return vld.check(userResult.length > 0, null, null, userResult);
      })
      .then(function(userResult) {
        done(null, userResult[0]);
      })
      .finally(function() {
        conn.release();
      });
  })
  .catch(function(err) {
    done(err, null);
  });
    //
    // db.User.find({where: {id: id}}).then(function(user){
    //     if(!user){
    //         console.error('Logged in user not in database, user possibly deleted post-login');
    //         return done(null, false);
    //     }
    //     console.log('Session: { id: ' + user.id + ', username: ' + user.email + ' }');
    //     done(null, user);
    // }).catch(function(err){
    //     done(err, null);
    // });
});

// Use facebook strategy
passport.use(new FacebookStrategy({
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL: config.facebook.callbackURL,
        // passReqToCallback: true,
        profileFields: ['id', 'emails', 'name']
    },
    // Whatever you pass into the second argument of done() will be available as
    //  req.user
    function(accessToken, refreshToken, profile, done) {
        connections.getConnectionP()
        .then(function(conn) {
          return conn.query('SELECT * FROM Person WHERE facebookId = ?', [profile.id])
          .then(function(fbUserResult) {
            if (fbUserResult.length === 0) {
              var newPerson = {
                email: profile.emails[0].value,
                lastName: profile.name.familyName,
                role: 2,
                password: "illuminati",
                whenRegistered: new Date(),
                termsAccepted: new Date()
              };
              return conn.query('INSERT INTO Person SET ?', newPerson);
            }
            else {
              done(null, fbUserResult[0]);
            }
          })
          .then(function(newUserResult) {
            done(null, newUserResult);
          })
          .finally(function() {
            conn.release();
          })
        })
        .catch(function(err) {
          done(err, null);
          console.log("OH NO ERROR: " + err);
        })
        // db.User.find({where : {facebookUserId: profile.id}}).then(function(user){
        //     if(!user){
        //         db.User.create({
        //             name: profile.displayName,
        //             email: profile.emails[0].value,
        //             username: profile.username,
        //             provider: 'facebook',
        //             facebookUserId: profile.id
        //         }).then(function(u){
        //             winston.info('New User (facebook) : { id: ' + u.id + ', username: ' + u.username + ' }');
        //             done(null, u);
        //         })
        //     } else {
        //         winston.info('Login (facebook) : { id: ' + user.id + ', username: ' + user.username + ' }');
        //         done(null, user);
        //     }
        // }).catch(function(err){
        //     done(err, null);
        // });
    }
));

module.exports = passport;
