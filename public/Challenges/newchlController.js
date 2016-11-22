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
      openTime: new Date(),
      attsAllowed: 1
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
      return scope.challenge.name === "" ||
      scope.challenge.description === "" ||
      scope.radioAnswers.length <= 1     ||
      !allAnswersFilled;
   };

   scope.addOption = function() {
      if (scope.radioAnswers.length >= 11) {
         toastr.error("That's ridiculous. It's not even funny.", "11 is enough");
         return;
      }
      scope.radioAnswers.push({answerText: ""});
   };

   scope.removeOption = function(ndx) {
      scope.radioAnswers.splice(ndx, 1);
   };

   scope.doChallengePost = function() {
      API.crss.challenge.post($stateParams.courseName, scope.challenge)
      .then(function() {
         $state.go('crs', { courseName: $stateParams.courseName });
      })
      .catch(function(err) {
         toastr.error("Oh no!", err.errMsg);
      });
   }

   scope.createMultChoice = function() {
      scope.challenge.choices = scope.radioAnswers.map(function(answer) {return answer.answerText});
      scope.challenge.answer = scope.correctRadioOption.chosen;
      scope.doChallengePost();
   };

   scope.createNumerical = function() {
      scope.doChallengePost();
   };

   scope.createShortAnswer = function() {
      scope.challenge.answer = JSON.stringify({exact: scope.challenge.exact.split(","), inexact: scope.challenge.inexact.split(",")});
      scope.doChallengePost();
   };
}])
