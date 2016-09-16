app.controller('chlController',
['$scope', '$state', '$stateParams', 'api', 'confirm', 'login',
 function(scope, $state, $stateParams, API, confirm, login) {
   var challengeName = $stateParams.challengeName;

   scope.challenge = {};
   scope.attempt = {
      challengeName: challengeName
   };

   if (!login.isLoggedIn()) {
      $state.go('home');
   }

   API.Chls.get(challengeName)
      .then(function(response) {
         scope.challenge = response.data;
      });

   scope.createAttempt = function() {
      API.Prss.Atts.post(scope.loggedUser.id, scope.attempt)
         .then(function() {
            $state.go('student');
         });
   }
}])
