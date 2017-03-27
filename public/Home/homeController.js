app.controller('homeController', ['$scope', '$state', '$rootScope', 'api', 'toasterror', function(scope, $state, $rootScope, API, toastr) {
   $rootScope.page = 'home';

   // If there's the "ticket" GET parameter, ask my ~users page if the ticket is legit

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
   API.logEntry.get().then(function(response) {
      scope.enrolledCourses = response.data.enrolled;
      scope.adminCourses = response.data.owned;
      saveToCache("enrolled_courses", scope.enrolledCourses);
   })
   .catch(toastr.doErrorMessage(function(err) {}));;
}])
