app.controller('crsController',
['$scope', '$state', '$stateParams', 'api', 'confirm', 'login', '$location', 'toastr',
function(scope, $state, $stateParams, API, confirm, login, $location, toastr) {
   scope.courseName = $stateParams.courseName;

   if (!login.isLoggedIn()) {
      $state.go('login');
   }

   scope.currDate = new Date();
   scope.courseData = getFromCache("coursedata_" + scope.courseName)|| {};
   scope.weeks = getFromCache("courseweeks_" + scope.courseName)|| [];

   scope.weekStatuses = [];

   scope.refreshchls = function() {
      return API.crss.challenge.get(scope.courseName)
      .then(function(response) {
         scope.weeks = response.data;
         scope.weeks.sort(function(a, b) {
            return a.weekIndexInCourse - b.weekIndexInCourse;
         });

         // Figure out what icon each week should have (or if it should be disabled)
         var now = new Date();
         var chlCloseDate = new Date();

         scope.weeks.forEach(function(week, ndx) {
            week.Challenges = week.Challenges.sort(function(a, b) {
               return new Date(a.openDate) - new Date(b.openDate);
            });
            var weekStart = new Date(week.startDate);
            if (weekStart.getTime() > now.getTime()) {
               week.stateClass = 'week-disabled';  // week hasn't started yet
               week.panelClass = "panel-disabled";
            }
            else {
               week.stateClass = "week-complete";
               week.panelClass = "panel-success";
               week.Challenges.forEach(function(chl) {
                  chl.scoringAttempts = chl.Attempts.sort(function(a, b) {
                     return b.pointsEarned - a.pointsEarned;
                  });
                  var chlOpenDate = new Date(chl.openDate);
                  chlCloseDate.setDate(chlOpenDate.getDate() + 1);

                  if (chlOpenDate > now) {
                     chl.stateClass = "chl-disabled"; // challenge isn't available yet
                     chl.dateMessage = "Opens " + formatDate(chl.openDate);
                  }
                  else if (chl.scoringAttempts[0] && chl.scoringAttempts[0].correct) {
                     chl.stateClass = "chl-solved";
                     chl.dateMessage = "Solved " + formatDate(chl.scoringAttempts[0].createdAt);
                  }
                  else if (chl.scoringAttempts.length >= chl.attsAllowed) {
                     chl.stateClass = "chl-solved";
                     chl.dateMessage = "Attempted " + formatDate(chl.Attempts[0].createdAt);
                  }
                  else if (chl.Attempts.length >= 1) {
                     chl.stateClass = "chl-attempted";
                     chl.dateMessage = "Attempted " + formatDate(chl.Attempts[0].createdAt);
                  }
                  else if (chlCloseDate > now) {
                     chl.stateClass = "chl-overdue";
                     week.stateClass ="week-open";
                     week.panelClass = "panel-warning";
                     scope.weekStatuses[ndx] = {open: true};
                     chl.dateMessage = "Opened " + formatDate(chl.openDate);
                  }
                  else {
                     chl.stateClass = "chl-open";
                     week.stateClass ="week-open";
                     week.panelClass = "panel-warning";
                     scope.weekStatuses[ndx] = {open: true};
                     chl.dateMessage = "Opened " + formatDate(chl.openDate);
                  }

                  if (week.Challenges.length === 0) {
                     week.stateClass = 'week-disabled';
                     week.panelClass = "panel-disabled";
                  }
               });
            }

            saveToCache("courseweeks_" + scope.courseName, scope.weeks);
         });
      });
   };

   scope.refreshchls();

   scope.isOpen = function(chl) {
      if (scope.loggedUser.role == 0) {
         return chl.openTime <= new Date();
      }
      else {
         return true;
      }
   }

   scope.addEnrollment = function() {
      if (!scope.email)
      return;

      // Get prsId
      API.prss.find(scope.email)
      .then(function(response) {
         var data = response.data;
         if (data.length === 0) {
            scope.errors = ['No user found for that email'];
         }
         else {
            return API.crss.enrs.post(scope.courseName, data[0].id)
            .then(function(data) {
               return scope.refreshenrs();
            });
         }
      })
      .catch(function(err) {
         if (err.data[0].tag === 'dupName') {
            scope.errors = ['User already enrolled'];
         }
         else
         scope.errors = err.data;
      });
   };

   scope.deleteEnrollment = function(enrId) {
      confirm(function() {
         API.crss.enrs.delete(scope.courseName, enrId)
         .then(function(res) {
            return scope.refreshenrs();
         });
      });
   };

   scope.createChallenge = function() {
      $state.go('newchallenge', {courseName: $stateParams.courseName, week: 0, day: 0, type: "multchoice" });
   };

   scope.viewChallenge = function(challengeName, stateClass) {
      if (stateClass !== 'chl-disabled') {
         $state.go('challenge', { courseName: scope.courseName, challengeName: challengeName});
      }
   };

   scope.goAdmin = function() {
      $state.go('courseAdmin', {courseName: scope.courseName});
   }

   scope.getCourseData = function() {
      API.crss.get($stateParams.courseName)
      .then(function(course) {
         scope.courseData = course.data;
         scope.enrollment = course.data.Enrollments[0];
         saveToCache("coursedata_" + scope.courseName, scope.courseData);
      })
      .catch(function(err) {
         if (err.data.tag === "notFound") {
            scope.we404now = true;
         }
         else {
            toastr.error("Oh no!", err.message);
         }
      });
   };

   scope.getCourseData();


   function formatDate(date) {
     if (typeof date === 'string') {
       date = new Date(date);
     }

     var monthNames = [
       "January", "February", "March",
       "April", "May", "June", "July",
       "August", "September", "October",
       "November", "December"
     ];

     var day = date.getDate();
     var monthIndex = date.getMonth();

     return monthNames[monthIndex] + ' ' + day;
   }
}])
