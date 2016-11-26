app.controller('homeController', ['$scope', '$state', 'login', '$rootScope', 'api', 'toastr', function(scope, state, login, $rootScope, API, toastr) {
   $rootScope.page = 'home';

   scope.enrollCourse = function(courseName) {
      API.crss.enrs.post(courseName, scope.loggedUser.id)
         .then(function(data) {
            
            onlyShowAvailableCourses();
         })
         .catch(function(err) {
            toastr.error("Uh oh!", err.errMsg);
         });
   };

   function onlyShowAvailableCourses() {
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
      scope.enrolledCourses = response.data;
      return API.crss.get();
   })
   .then(function(response) {
      scope.availableCourses = response.data;
      onlyShowAvailableCourses();
   })
   .catch(function(err) {
      toastr.error("Uh oh!", err.errMsg);
   });;
}])
