app.controller('crsAdminController',
['$scope', '$state', '$stateParams', 'api', 'confirm', 'login', '$location', 'toastr',
function(scope, $state, $stateParams, API, confirm, login, $location, toastr) {
  scope.courseName = $stateParams.courseName; // TODO: gonna need to make a network call here I think, unfortunately.

  if (!login.isLoggedIn()) {
    $state.go('login');
  }

  scope.currDate = new Date();

  scope.courseData = {};

  scope.weekStatuses = [];

  scope.refreshenrs = function() {
    return API.crss.enrs.get(scope.courseName)
    .then(function(response) {
      scope.enrs = response.data;
    });
  };

  scope.refreshenrs();

  scope.refreshchls = function() {
    return API.crss.challenge.get(scope.courseName)
    .then(function(response) {
      scope.weeks = response.data;
      scope.weeks.sort(function(a, b) {
        return a.weekIndexInCourse - b.weekIndexInCourse;
      });

      scope.weeks.forEach(function(week, ndx) {
        // For each week, look for holes in the "dayIndex" range 0-6 and
        //  fill them with "add Challenge" rows
        week.sortedChallenges = [];
        scope.weekStatuses[ndx] = {open: false};

        for (var ndx = 0; ndx < 7; ndx++) {
          var challengeForDay = week.Challenges.find(function(chl) {
            return chl.dayIndex === ndx;
          });

          if (challengeForDay === undefined) {
            week.sortedChallenges[ndx] = {name: "Create a challenge", stateClass: "chl-empty"};
            scope.weekStatuses[ndx] = {open: true};
          }
          else {
            challengeForDay.stateClass = "chl-created"
            week.sortedChallenges[ndx] = challengeForDay;
          }
        }
      });
    });
  };

  scope.refreshchls();

  scope.refreshitms = function() {
    return API.crss.itms.get(scope.courseName)
    .then(function(response) {
      scope.itms = response.data;
    });
  };

  scope.makingitm = false;
  scope.newitm = {};

  scope.createitm = function() {
    scope.makingitm = false;
    API.crss.itms.post(scope.courseName, scope.newitm)
    .then(scope.refreshitms)
    .catch(function(err) {
      scope.shopErrors = ["There's already an item named " + scope.newitm.name];
    });
  }

  scope.deleteitm = function(itmId) {
    API.crss.itms.delete(scope.courseName, itmId)
    .then(scope.refreshitms)
    .catch(function(err) {
      scope.shopErrors = ["Error deleting item"];
    });
  }

  scope.refreshitms();

  scope.isOpen = function(chl) {
    if (scope.loggedUser.role == 0) {
      return chl.openTime <= new Date();
    }
    else {
      return true;
    }
  }

  scope.addEnrollment = function() {
    if (!scope.email)
    return;

    // Get prsId
    API.prss.find(scope.email)
    .then(function(response) {
      var data = response.data;
      if (data.length === 0) {
        scope.errors = ['No user found for that email'];
      }
      else {
        return API.crss.enrs.post(scope.courseName, data[0].id)
        .then(function(data) {
          return scope.refreshenrs();
        });
      }
    })
    .catch(function(err) {
      if (err.data[0].tag === 'dupName') {
        scope.errors = ['User already enrolled'];
      }
      else
      scope.errors = err.data;
    });
  };

  scope.deleteEnrollment = function(enrId) {
    confirm(function() {
      API.crss.enrs.delete(scope.courseName, enrId)
      .then(function(res) {
        return scope.refreshenrs();
      });
    });
  };

  scope.createChallenge = function() {
    $state.go('newchallenge', {courseName: $stateParams.courseName, week: 0, day: 0});
  }

  scope.viewChallenge = function(challenge, weekIndex, dayIndex) {
    if (challenge.stateClass === 'chl-empty') {
      $state.go('newchallenge', {courseName: $stateParams.courseName, week: weekIndex, day: dayIndex})
    }
    else {
      $state.go('challenge', { courseName: scope.courseName, challengeName: challenge.sanitizedName});
    }
  }

  scope.getCourseData = function() {
    API.crss.get($stateParams.courseName)
    .then(function(course) {
      scope.courseData = course.data;
    })
    .catch(function(err) {
      toastr.error("Oh no!", err.message);
    });
  };

  scope.getCourseData();
}])
