// This middleware assumes cookieParser has been "used" before this

var crypto = require('crypto');
var sequelize = require('./sequelize.js');

var sessions = {};
var duration = 604800 * 1000 * 10; // ten weeks in milliseconds
var cookieName = 'CHSAuth';

exports.router = function(req, res, next) {
   if (req.cookies[cookieName]) {
      if (sessions[req.cookies[cookieName]]) {
         if (sessions[req.cookies[cookieName]].lastUsed < new Date().getTime() - duration) {
            delete sessions[req.cookies[cookieName]];
         }
         else {
            req.session = sessions[req.cookies[cookieName]];
         }
      }
   }
   next();
};

var Session = function Session(user, oldSession) {
   if (!user && oldSession) {
      this.firstName = oldSession.firstName;
      this.lastName = oldSession.lastName;
      this.id = oldSession.id;
      this.email = oldSession.email;
      this.loginTime = oldSession.loginTime;
      this.lastUsed = oldSession.lastUsed;
      this.role = oldSession.role;
   }
   else {
      this.firstName = user.firstName;
      this.lastName = user.lastName;
      this.id = user.id;
      this.email = user.email;
      this.loginTime = new Date().getTime();
      this.lastUsed = new Date().getTime();
      this.role = user.role;
   }
};

Session.prototype.isAdmin = function() {
   return this.role == 2;
};

Session.prototype.isTeacher = function() {
   return this.role == 1;
};

Session.prototype.isAdminOrTeacher = function() {
   return this.role == 1 || this.role == 2;
};

exports.makeSession = function makeSession(user, res) {
   var cookie = crypto.randomBytes(16).toString('hex');
   var session = new Session(user);

   res.cookie(cookieName, cookie, { maxAge: duration, httpOnly: true });
   sessions[cookie] = session;

   return cookie;
};

exports.deleteSession = function(cookie) {
   delete sessions[cookie];
};

exports.restoreSessions = function(jsonSessions) {
   for (key in jsonSessions) {
      var restoredSession = new Session(null, jsonSessions[key]);
      sessions[key] = restoredSession;
      console.log("REstored session ", jsonSessions[key]);
   }
};

exports.cookieName = cookieName;
exports.sessions = sessions;
