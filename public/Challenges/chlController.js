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

   API.chls.get(challengeName)
      .then(function(response) {
         scope.challenge = response.data;
      })
      .catch(function(err) {
         
      });

   scope.createAttempt = function() {
      API.prss.atts.post(scope.loggedUser.id, scope.attempt)
         .then(function() {
            $state.go('student');
         });
   }
}])
