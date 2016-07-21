app.controller('teacherController',
['$scope', '$state', 'api', 'confirm', 'login', '$rootScope',
 function(scope, $state, API, confirm, login, $rootScope) {
   $rootScope.page = 'teacher';

   scope.courses = [];

   if (!login.isLoggedIn()) {
      $state.go('home');
   }

   scope.refreshCrss = function() {
      return API.Prss.Crss.get(scope.loggedUser.id)
         .then(function(response) {
            scope.courses = response.data;
         });
   };

   scope.refreshCrss();

   scope.createCourse = function() {
      if (!scope.courseName)
         return;

      console.log("Making new course named " + scope.courseName);
      API.Crss.post({ name: scope.courseName })
         .then(scope.refreshCrss)
         .catch(function(err) {
            if (err.data[0].tag === 'dupName') {
               scope.errors = ['Course name ' + scope.courseName + ' is taken'];
            }
            else
               scope.errors = err.data;
         });
   };

   scope.deleteCourse = function(courseName) {
      confirm(function() {
         API.Crss.delete(courseName)
            .then(function(res) {
               return scope.refreshCrss();
            });
      });
   };

   scope.viewCourse = function(courseName) {
      $state.go('crs', { courseName: courseName });
   };
}])
