app.controller('newchlController',
['$scope', '$state', '$stateParams', 'api', 'confirm', 'login',
 function(scope, $state, $stateParams, API, confirm, login) {
   scope.challenge = {
      name: "",
      description: ""
   };
   scope.radioAnswers = [
      { answerText: "" },
      { answerText: "" }
   ];

   scope.correctRadioOption = {
      chosen: "0"
   };

   if (!login.isLoggedIn()) {
      $state.go('home');
   }

   scope.challengeNotReady = function() {
      var allAnswersFilled = true;
      scope.radioAnswers.forEach(function(answer) {
         if (answer.answerText === "") {
            allAnswersFilled = false;
         }
      });
      return scope.challenge.name === ""        ||
             scope.challenge.description === "" ||
             scope.radioAnswers.length <= 1     ||
             !allAnswersFilled;
   };

   scope.addOption = function() {
      scope.radioAnswers.push({answerText: ""});
   };

   scope.removeOption = function(ndx) {
      scope.radioAnswers.splice(ndx, 1);
   };

   scope.createMultChoice = function() {
      var newChallenge = {
         name: scope.challenge.name,
         description: scope.challenge.description,
         answer: scope.correctRadioOption.chosen,
         attsAllowed: 1,
         type: "multchoice",
         choices: scope.radioAnswers.map(function(answer) {return answer.answerText}),
         courseName: $stateParams.courseName,
         openTime: new Date(), // TODO: calculate based on $stateParams.week and $stateParams.day
      }

      API.chls.post(newChallenge)
         .then(function() {
            $state.go('crs', { courseName: $stateParams.courseName });
         })
         .catch(function(err) {
            console.warn("OH NO ERR: " + err);
         });
   }
}])
