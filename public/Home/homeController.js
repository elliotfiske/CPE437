app.controller('homeController', ['$scope', '$state', 'login', '$rootScope', 'api', 'toasterror', function(scope, $state, login, $rootScope, API, toastr) {
   $rootScope.page = 'home';

   scope.enrolledCourses = getFromCache("enrolled_courses") || [];
   scope.availableCourses = getFromCache("available_courses") || [];
   scope.adminCourses = [];
   scope.encouragements = [];

   scope.gotoCourse = function(courseName, asAdmin) {
      if (asAdmin) {
         $state.go('courseAdmin', {courseName: courseName});
      }
      else {
         $state.go('course', {courseName: courseName});
      }
   };

   scope.enrollCourse = function(courseName) {
      API.crss.enrs.post(courseName, scope.loggedUser.email)
         .then(function(response) {
            scope.enrolledCourses = response.data;
            onlyShowAvailableCourses();
         })
         .catch(toastr.doErrorMessage(function(err) {}));
   };

   function onlyShowAvailableCourses() {
      scope.enrolledCourses.forEach(function(crs, ndx) {
         if (crs.Enrollment.streak === 0) {
            scope.encouragements[ndx] = "No streak yet! Get it started today!";
         }
         else if (crs.Enrollment.streak === 1) {
            scope.encouragements[ndx] = "1 day streak!";
         }
         else if (crs.Enrollment.streak < 5) {
            scope.encouragements[ndx] = crs.Enrollment.streak + " day streak! Keep it up!";
         }
         else {
            scope.encouragements[ndx] = "Incredible! " + crs.Enrollment.streak + " day streak! 🔥🔥🔥";
         }
      });

      scope.availableCourses = scope.availableCourses.filter(function(course) {
         for (var ndx = 0; ndx < scope.enrolledCourses.length; ndx++) {
            if (scope.enrolledCourses[ndx].name == course.name) {
               return false;
            }
         }
         return true;
      });
   }

   onlyShowAvailableCourses();

   // Get courses and available courses
   if (scope.loggedUser) {
      API.prss.enrs.get(scope.loggedUser.id).then(function(response) {
         scope.enrolledCourses = response.data.enrolled;
         scope.adminCourses = response.data.owned;
         saveToCache("enrolled_courses", scope.enrolledCourses);
         return API.crss.get();
      })
      .then(function(response) {
         scope.availableCourses = response.data;
         saveToCache("available_courses", scope.enrolledCourses);
         onlyShowAvailableCourses();
      })
      .catch(toastr.doErrorMessage(function(err) {}));
   }

   if ($state.params.ticket) {
      console.log("Ticket time! Logging you in with", $state.params.ticket);
      // Make call to our backend to validate ticket.

      API.validation.post($state.params.ticket).then(function(response) {
         console.log("Logged in as ", response.username);
      })
      .catch(toastr.doErrorMessage(function(err) {}));
   }
   else {
      console.log("No ticket? no problem!");
   }
}])
