app.controller('newchlController',
['$scope', '$state', '$stateParams', 'api', 'confirm', 'login', 'toastr',
function(scope, $state, $stateParams, API, confirm, login, toastr) {
   scope.currTab = {
      nane: "numerical"
   };

   scope.numericalChallenge = false;
   scope.multchoiceChallenge = false;
   scope.shortanswerChallenge = false;

   scope.challenge = {
      name: "",
      description: "",
      courseName: $stateParams.courseName,
      openTime: new Date()
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

   scope.numChallengeNotReady = function() {
      return scope.challenge.name === "" ||
      scope.challenge.description === "" ||
      scope.challenge.answer === "";
   }

   scope.shortChallengeNotReady = function() {
      return scope.challenge.name === "" ||
      scope.challenge.description === "" ||
      scope.challenge.exact === "";
   };

   scope.mcChallengeNotReady = function() {
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
      };

      API.crss.challenge.post($stateParams.courseName, newChallenge)
      .then(function() {
         $state.go('crs', { courseName: $stateParams.courseName });
      })
      .catch(function(err) {
         toastr.error("Oh no!", err.errMsg);
      });
   };

   scope.createNumerical = function() {
      scope.challenge.type = "number";
      API.crss.challenge.post($stateParams.courseName, scope.challenge)
      .then(function() {
         $state.go('crs', { courseName: $stateParams.courseName });
      })
      .catch(function(err) {
         toastr.error("Oh no!", err.errMsg);
      });
   };

   scope.createShortAnswer = function() {
      scope.challenge.answer = JSON.stringify({exact: scope.challenge.exact.split(","), inexact: scope.challenge.inexact.split(",")});
      scope.challenge.type = "shortanswer";
      API.crss.challenge.post($stateParams.courseName, scope.challenge)
      .then(function() {
         $state.go('crs', { courseName: $stateParams.courseName });
      })
      .catch(function(err) {
         toastr.error("Oh no!", err.errMsg);
      });
   };
}])
