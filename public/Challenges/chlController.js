app.controller('chlController',
['$scope', '$state', '$stateParams', 'api', 'confirm', 'login', 'toasterror', '$sce',
function(scope, $state, $stateParams, API, confirm, login, toastr, $sce) {
   var challengeName = $stateParams.challengeName;

   scope.challenge = {};
   scope.attempt = {};
   scope.challengeOpen = false;
   scope.challengeClosed = false;
   scope.challengeComplete = false;

   scope.letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];

   scope.multChoice = {
      chosen: null
   };

   if (!login.isLoggedIn()) {
      $state.go('login');
   }

   API.crss.challenge.get($stateParams.courseName, challengeName)
   .then(function(response) {
      scope.challenge = response.data;
      if (scope.challenge.Attempts[0] && scope.challenge.Attempts[0].correct) {
         scope.challengeComplete = true;
      }
      else if (scope.challenge.Attempts.length >= scope.challenge.attsAllowed) {
         scope.challengeClosed = true;
      }
      else {
         scope.challengeOpen = true;
      }
   })
   .catch(toastr.doErrorMessage(function(err) {
      // whatever
   }));

   scope.answerNumerical = function() {
      scope.attempt.input = scope.attempt.numInput.toString();
      scope.createAttempt();
   };

   scope.answerMultipleChoice = function() {
      scope.attempt.input = scope.multChoice.chosen;
      scope.createAttempt();
   };

   scope.createAttempt = function() {
      scope.attempt.test = $stateParams.test;
      API.crss.challenge.attempt.post($stateParams.courseName, $stateParams.challengeName, scope.attempt)
      .then(function(attemptInfo) {
         if (attemptInfo.data.correct) {
            toastr.success("Correct!", "Good job!");
            $state.go('course', {courseName: $stateParams.courseName});
         }
         else if (attemptInfo.data.attsLeft > 0) {
            var attempts = attemptInfo.data.attsLeft == 1 ? " attempt " : " attempts ";
            toastr.error("Sorry! That's incorrect. You have " + attemptInfo.data.attsLeft + attempts + "left.");
         }
         else {
            $state.go('course', {courseName: $stateParams.courseName});
            toastr.error("Sorry! That's incorrect. Don't worry, you still got points for that question.");
         }

         scope.loggedUser.commitment = attemptInfo.data.newCommitment;
      })
      .catch(function(err) {
         toastr.error("Uh oh!", "Error: " + err.message);
      });
   }
}])
