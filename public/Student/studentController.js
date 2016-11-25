app.controller('studentController', ['$scope', '$state', 'api', 'confirm', 'login', '$rootScope',
 function(scope, $state, API, confirm, login, $rootScope) {
   $rootScope.page = 'student';

   scope.inProgressChallenges = [];
   scope.challenges = [];
   scope.mappedChallenges = {};

   scope.enrolledCourses = [];
   scope.availableCourses = [];

   scope.accordionStatus = [
      {open: true, disabled: false},
      {open: false, disabled: true}
   ];

   if (!login.isLoggedIn()) {
      $state.go('home');
   }

   /*** CHALLENGE STUFF ***/
   scope.startChallenge = function(challengeName) {
      API.prss.atts.post(scope.loggedUser.id, challengeName)
         .then(scope.refreshatts);
   };

   scope.refreshatts = function() {
      return API.prss.atts.get(scope.loggedUser.id)
         .then(function(response) {
            scope.grouped = {};

            scope.inProgressChallenges = [];

            angular.forEach(response.data, function(attempt) {
               var challengeName = attempt.challengeName;

               scope.grouped[challengeName] = scope.grouped[challengeName] || [];

               scope.grouped[challengeName].unshift(attempt);
               if (scope.inProgressChallenges.indexOf(challengeName) < 0)
                  scope.inProgressChallenges.push(attempt.challengeName);
            });
         });
   };

   scope.isWithinDay = function(attempt, challengeName) {
      if (!scope.mappedChallenges[challengeName])
         return false;

      var closeTime = new Date(scope.mappedChallenges[challengeName].openTime)
      closeTime.setDate(closeTime.getDate() + 1);

      return closeTime >= attempt.startTime;
   }

   scope.notInProgress = function(challenge) {
      return scope.inProgressChallenges.indexOf(challenge.name) < 0;
   };

   scope.isOpen = function(challengeName) {
      return scope.mappedChallenges[challengeName] && scope.mappedChallenges[challengeName].attsAllowed > scope.grouped[challengeName].length;
   };

   scope.getAttColor = function(att) {
      var styles = ['success', 'warning', 'danger'];

      return styles[2 - att.score] || "";
   };

   /*** ENROLLMENTS ***/
   scope.enrollCourse = function(courseName) {
      API.crss.enrs.post(courseName, scope.loggedUser.id)
         .then(function(data) {
            return scope.refreshatts();
         });
   };

   /*** INITIAL API CALLS ***/
   API.crss.challenge.get(course)
   API.prss.chls.get(scope.loggedUser.id).then(function(response) {
      scope.weeks = response.data;

      // scope.challenges.forEach(function(challenge) {
      //    scope.mappedChallenges[challenge.name] = challenge;
      // });
   });

   API.prss.enrs.get(scope.loggedUser.id).then(function(response) {
      scope.enrolledCourses = response.data;
      return API.crss.get();
   })
   .then(function(response) {
      scope.availableCourses = response.data;
      scope.availableCourses = scope.availableCourses.filter(function(course) {
         for (var ndx = 0; ndx < scope.enrolledCourses.length; ndx++) {
            if (scope.enrolledCourses[ndx].name == course.name) {
               return false;
            }
         }
         return true;
      });
   });

   scope.refreshatts();
}])
