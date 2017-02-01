app.controller('homeController', ['$scope', '$state', 'login', '$rootScope', 'api', 'toasterror', function(scope, $state, login, $rootScope, API, toastr) {
   $rootScope.page = 'home';

   scope.enrolledCourses = [];
   scope.adminCourses = [];

   if (!login.isLoggedIn()) {
      $state.go('login');
      return;
   }

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
      scope.enrolledCourses.forEach(function(crs) {
         if (crs.Enrollment.streak === 0) {
            crs.Enrollment.encouragement = "No streak yet! Get it started today!";
         }
         else if (crs.Enrollment.streak === 1) {
            crs.Enrollment.encouragement = "1 day streak!";
         }
         else if (crs.Enrollment.streak < 5) {
            crs.Enrollment.encouragement = crs.Enrollment.streak + " day streak! Keep it up!";
         }
         else {
            crs.Enrollment.encouragement = "Incredible! " + crs.Enrollment.streak + " day streak! 🔥🔥🔥";
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

   // Get courses and available courses
   API.prss.enrs.get(scope.loggedUser.id).then(function(response) {
      scope.enrolledCourses = response.data.enrolled;
      scope.adminCourses = response.data.owned;
      return API.crss.get();
   })
   .then(function(response) {
      scope.availableCourses = response.data;
      onlyShowAvailableCourses();
   })
   .catch(toastr.doErrorMessage(function(err) {}));;
}])
