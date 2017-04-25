app.controller('newchlController',
['$scope', '$state', '$stateParams', 'api', 'confirm', 'login', 'toastr',
function(scope, $state, $stateParams, API, confirm, login, toastr) {

  scope.challenge = {
    name: "",
    description: "",
    courseName: $stateParams.courseName,
    type: "number",
    openTime: new Date(),
    attsAllowed: 3,
    weekIndex: $stateParams.week,
    dayIndex: $stateParams.day,
    rawTags: []
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

  scope.fuzzySearch = null;
  scope.cachedTags = null;
  scope.loadTags = function(query) {
    if (scope.cachedTags === null) {
      return API.crss.tags.get($stateParams.courseName)
      .then(function(tags) {
        scope.cachedTags = tags.data;
        scope.fuzzySearch = new Fuse(scope.cachedTags, {
          shouldSort: true,
          threshold: 2,
          location: 0,
          distance: 100,
          maxPatternLength: 32,
          minMatchCharLength: 1,
          keys: ["text"],
        });
      })
      .then(scope.sortTags(query));
    }
    else {
      return scope.sortTags(query)();
    }
  }

  scope.sortTags = function(query) {
    return function() {
      var result = scope.fuzzySearch.search(query);
      var leftovers = scope.cachedTags.filter(function(element) { // append elements not matched manually
        return result.indexOf(element) === -1;
      });
      result = result.concat(leftovers);
      return Promise.resolve(result);
    }
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
    scope.challenge.tags = scope.challenge.rawTags.map(function(tag) {
      return tag.text;
    });

    API.crss.challenge.post($stateParams.courseName, scope.challenge)
    .then(function() {
      $state.go('courseAdmin', { courseName: $stateParams.courseName });
    })
    .catch(function(err) {
      toastr.error("Oh no!", err.errMsg);
    });
  }

  scope.createMultChoice = function() {
    scope.challenge.choices = scope.radioAnswers.map(function(answer) {return answer.answerText});
    scope.challenge.answer = scope.correctRadioOption.chosen;
    scope.challenge.attsAllowed = 1; // Don't want people guessing many times on multiple choice
    scope.doChallengePost();
  };

  scope.createNumerical = function() {
     scope.challenge.answer = scope.challenge.numAnswer;
    scope.doChallengePost();
  };

  scope.createShortAnswer = function() {
     scope.challenge.answer =  scope.challenge.exact.map(function(answer) {
        return answer.text
     });
     scope.doChallengePost();
  };
}])
