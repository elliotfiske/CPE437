app.controller('studentController', ['$scope', '$state', 'api', 'confirm', 'login', '$rootScope',
 function(scope, $state, API, confirm, login, $rootScope) {
   $rootScope.page = 'student';

   scope.inProgress = [];
   scope.inProgressChallenges = [];
   scope.challenges = [];

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
            scope.inProgress = [];
            scope.inProgressChallenges = [];

            angular.forEach(response.data, function(attempt) {
               if (attempt.state === 2) {
                  scope.inProgress.push(attempt);
                  scope.inProgressChallenges.push(attempt.challengeName);
               }
            });
         });
   };

   scope.notInProgress = function(challenge) {
      return scope.inProgressChallenges.indexOf(challenge.name) < 0;
   };

   scope.getAttColor = function(att) {
      var styles = ['panel-success', 'panel-danger', 'panel-warning'];

      return styles[att.state] || "";
   };

   API.Chls.get().then(function(response) {
      scope.challenges = response.data;
   });

   scope.refreshAtts();
}])
