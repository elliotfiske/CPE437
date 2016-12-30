app.controller('crsController',
['$scope', '$state', '$stateParams', 'api', 'confirm', 'login', '$location', 'toastr',
function(scope, $state, $stateParams, API, confirm, login, $location, toastr) {
   scope.courseName = $stateParams.courseName; // TODO: gonna need to make a network call here I think, unfortunately.

   if (!login.isLoggedIn()) {
      $state.go('login');
   }

   scope.currDate = new Date();
   scope.courseData = {};

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
               a.startDate - b.startDate;
            });
            if (new Date(week.startDate) > now) { // week hasn't started yet
            week.stateClass = 'week-disabled';
         }
         else {
            week.stateClass = "week-complete"
            week.Challenges.forEach(function(chl) {
               var chlOpenDate = new Date(chl.startDate);
               chlCloseDate.setDate(chlOpenDate.getDate() + 1);

               if (chlOpenDate > now) { // challenge isn't available yet
               chl.stateClass = "chl-disabled";
            }
            else if (chl.Attempts[0] && chl.Attempts[0].correct) {
               chl.stateClass = "chl-solved";
            }
            else if (chl.Attempts.length >= 1) {
               chl.stateClass = "chl-attempted";
            }
            else if (chlCloseDate > now) {
               chl.stateClass = "chl-overdue";
               week.stateClass ="week-open";
            }
            else {
               chl.stateClass = "chl-open";
               week.stateClass ="week-open";
               scope.weekStatuses[ndx] = {open: true};
            }
         });
      }
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

scope.viewChallenge = function(challengeName) {
   $state.go('challenge', { courseName: scope.courseName, challengeName: challengeName});
};

scope.goAdmin = function() {
   $state.go('courseAdmin', {courseName: scope.courseName});
}

scope.getCourseData = function() {
   API.crss.get($stateParams.courseName)
   .then(function(course) {
      scope.courseData = course.data;
      scope.enrollment = course.data.Enrollments[0];
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

}])
