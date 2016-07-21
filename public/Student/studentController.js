app.controller('studentController', ['$scope', '$state', '$http', 'attStateFilter', '$uibModal', 'login', '$rootScope', 'challenges', 'attempts',
 function(scope, $state, $http, attStateFilter, uibM, login, $rootScope, challenges, attempts) {
   $rootScope.page = 'student';

   scope.inProgress = [];
   scope.inProgressChallenges = [];
   scope.challenges = [];

   if (!login.isLoggedIn()) {
      $state.go('home');
   }

   scope.startChallenge = function(challengeName) {
      attempts.start(scope.loggedUser.id, challengeName)
         .then(function() {
            scope.refreshAtts();
         });
   };

   scope.refreshAtts = function() {
      return $http.get("Prss/" + scope.loggedUser.id + "/Atts")
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

   scope.quitAtt = function(attId) {
      var confirm = uibM.open({
         templateUrl: 'Courses/confirmDelete.html',
         scope: scope,
         size: 'sm'
      });
      confirm.result.then(function(confirmed) {
         if (confirmed) {
            $http.put('Atts/' + attId)
            .then(function(res) {
               return scope.refreshAtts();
            });
         }
      })
   };

   challenges.get().then(function(data) {
      scope.challenges = data;
   });

   scope.refreshAtts();
}])
