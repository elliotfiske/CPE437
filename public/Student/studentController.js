app.controller('studentController', ['$scope', '$state', 'api', 'confirm', 'login', '$rootScope',
 function(scope, $state, API, confirm, login, $rootScope) {
   $rootScope.page = 'student';

   scope.inProgressChallenges = [];
   scope.challenges = [];
   scope.mappedChallenges = {};

   if (!login.isLoggedIn()) {
      $state.go('home');
   }

   scope.startChallenge = function(challengeName) {
      API.Prss.Atts.post(scope.loggedUser.id, challengeName)
         .then(scope.refreshAtts);
   };

   scope.refreshAtts = function() {
      return API.Prss.Atts.get(scope.loggedUser.id)
         .then(function(response) {
            scope.grouped = {};

            scope.inProgressChallenges = [];

            angular.forEach(response.data, function(attempt) {
               var challengeName = attempt.challengeName;

               scope.grouped[challengeName] = scope.grouped[challengeName] || [];

               scope.grouped[challengeName].push(attempt);
               if (scope.inProgressChallenges.indexOf(challengeName) < 0)
                  scope.inProgressChallenges.push(attempt.challengeName);
            });
         });
   };

   scope.notInProgress = function(challenge) {
      return scope.inProgressChallenges.indexOf(challenge.name) < 0;
   };

   scope.isOpen = function(challengeName) {
      return scope.mappedChallenges[challengeName].attsAllowed > scope.grouped[challengeName].length;
   };

   scope.getAttColor = function(att) {
      var styles = ['success', 'warning', 'danger'];

      return styles[2 - att.score] || "";
   };

   API.Chls.get().then(function(response) {
      scope.challenges = response.data;

      scope.challenges.forEach(function(challenge) {
         scope.mappedChallenges[challenge.name] = challenge;
      })
   });

   scope.refreshAtts();
}])
