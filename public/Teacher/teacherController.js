app.controller('teacherController',
['$scope', '$state', 'api', 'confirm', 'login', '$rootScope',
 function(scope, $state, API, confirm, login, $rootScope) {
   $rootScope.page = 'teacher';

   scope.courses = [];

   if (!login.isLoggedIn()) {
      $state.go('home');
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
            if (err.data[0].tag === 'dupName') {
               scope.errors = ['Course name ' + scope.courseName + ' is taken'];
            }
            else
               scope.errors = err.data;
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
      $state.go('crs', { courseName: courseName });
   };
}])
