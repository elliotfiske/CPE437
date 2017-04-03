app.controller('crsTeacherController',
['$scope', '$state', '$stateParams', 'api', 'confirm', 'login', '$location', 'toasterror', '$q',
function(scope, $state, $stateParams, API, confirm, login, $location, toastr, $q) {
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

  scope.isOpen = function(chl) {
    if (scope.loggedUser.role == 0) {
      return chl.openTime <= new Date();
    }
    else {
      return true;
    }
  }

  scope.addEnrollment = function() {
     if (!scope.email) {
        return;
     }

     // Create user if none exists
     API.prss.find(scope.email + "@calpoly.edu")
     .then(function(response) {
        var data = response.data;
        if (data.length === 0) {
           return API.prss.post({
             email: scope.email + "@calpoly.edu",
             role: 0,
             forcePeasant: true
          });
       }
       else {
          return $q.resolve(data[0]);
       }
    })
    .then(function(toEnroll) {
      return API.crss.enrs.post(scope.courseName, toEnroll.email || toEnroll.data.email);
   })
   .then(function() {
      return scope.refreshenrs();
   })
   .catch(toastr.doErrorMessage(function(err) {
      toastr.error("Don't worry, I'll look into it.", "Something went wrong!");
   }));
};

  scope.deleteEnrollment = function(enrId) {
    confirm(function() {
      API.crss.enrs.delete(scope.courseName, enrId)
      .then(function(res) {
        return scope.refreshenrs();
      });
    });
  };

  scope.createChallenge = function(challenge, weekIndex, dayIndex) {
     if (challenge.stateClass === 'chl-empty') {
        $state.go('newchallenge', {courseName: $stateParams.courseName, week: weekIndex, day: dayIndex})
     }
  }

  scope.viewChallenge = function(challenge, weekIndex, dayIndex) {
     $state.go('challenge', { courseName: scope.courseName, challengeName: challenge.sanitizedName, test: true});
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
