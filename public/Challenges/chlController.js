app.controller('chlController',
['$scope', '$state', '$stateParams', 'api', 'confirm', 'login', 'toastr',
function(scope, $state, $stateParams, API, confirm, login, toastr) {
   var challengeName = $stateParams.challengeName;

   scope.challenge = {};
   scope.attempt = {
      challengeName: challengeName
   };

   scope.multChoice = {
      chosen: null
   };

   if (!login.isLoggedIn()) {
      $state.go('login');
   }

   API.crss.challenge.get($stateParams.courseName, challengeName)
   .then(function(response) {
      scope.challenge = response.data;
   })
   .catch(function(err) {
      if (err.tag == "notFound") {
         toastr.error("Uh oh!", "Couldn't find a challenge called '"
         + challengeName + "'");
      }
      else {
         toastr.error("Uh oh!", err.errMsg);
      }
   });

   scope.answerMultipleChoice = function() {
      scope.attempt.input = scope.multChoice.chosen;
      scope.createAttempt();
   };

   scope.createAttempt = function() {
      scope.attempt.input = scope.attempt.input.toString();
      API.prss.atts.post(scope.loggedUser.id, scope.attempt)
      .then(function(wasCorrect) {
         if (wasCorrect.data.score >= 2) {
            toastr.success("Correct!", "Good job!");
         }
         else if (wasCorrect.data.score == 1) {
            toastr.warning("That answer wasn't quite right. Consider rephrasing it!");
         }
         else {
            toastr.error("Sorry! That's incorrect.");
         }
         $state.go('course', {courseName: $stateParams.courseName});
      })
      .catch(function(err) {
         toastr.error("Uh oh!", "Error: " + err.message);
      });
   }
}])
