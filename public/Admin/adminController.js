app.controller('adminController',
['$scope', '$state', 'api', 'confirm', 'login', '$rootScope', 'toasterror',
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
      if (!scope.courseName || !scope.teacherEmail)
         return;

      console.log("Making new course named " + scope.courseName);
      API.crss.post({ name: scope.courseName, owner: scope.teacherEmail })
      .then(scope.refreshcrss)
      .then(function() {
         toastr.success("Success!");
      })
      .catch(toastr.doErrorMessage(function(err) {
         if (err.dupName) {
            toastr.error("There's already a course named '" + scope.courseName + ".'", 'Uh oh!');
         }
      }));
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

   // WHAT YEAR IS IT
   API.timeTest.get()
   .then(function(daTime) {
      scope.daTime = (new Date(daTime.data)).toLocaleString();
   })
   .catch(toastr.doErrorMessage(function() {}));
}])
