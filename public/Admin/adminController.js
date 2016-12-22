app.controller('adminController',
['$scope', '$state', 'api', 'confirm', 'login', '$rootScope', 'toastr',
 function(scope, $state, API, confirm, login, $rootScope, toastr) {
   $rootScope.page = 'admin';

   scope.courses = [];

   if (!login.isLoggedIn()) {
      $state.go('login');
   }

   scope.refreshcrss = function() {
      return API.prss.crss.get(scope.loggedUser.id)
         .then(function(response) {
            scope.courses = response.data;
         });
   };

   scope.refreshcrss();

   scope.createCourse = function() {
      if (!scope.courseName)
         return;

      console.log("Making new course named " + scope.courseName);
      API.crss.post({ name: scope.courseName })
         .then(scope.refreshcrss)
         .catch(function(err) {
            if (err.data.tag === 'dupName') {
               toastr.error("There's already a course named '" + scope.courseName + ".'", 'Uh oh!');
            }
         });
   };

   scope.deleteCourse = function(courseName) {
      confirm(function() {
         API.crss.delete(courseName)
            .then(function(res) {
               return scope.refreshcrss();
            });
      });
   };

   scope.viewCourse = function(courseName) {
      $state.go('course', { courseName: courseName });
   };
}])
