app.controller('crssController',
['$scope', '$state', '$http', 'attStateFilter', '$uibModal', 'login',
 function(scope, $state, $http, attStateFilter, uibM, login) {
   scope.crss = [];

   if (!scope.loggedUser) {
      $state.go('home');
   }

   scope.refreshCrss = function() {
      return $http.get("Prss/" + scope.loggedUser.id + "/Crss")
         .then(function(response) {
            scope.crss = response.data;
         });
   };

   scope.refreshCrss();

   scope.createCourse = function() {
      if (!scope.courseName)
         return;

      console.log("Making new course named " + scope.courseName);
      $http.post('Crss', { name: scope.courseName })
      .then(function(res) {
         return scope.refreshCrss();
      })
      .catch(function(err) {
         if (err.data[0].tag === 'dupName') {
            scope.errors = ['Course name ' + scope.courseName + ' is taken'];
         }
         else
            scope.errors = err.data;
      });
   };

   scope.deleteCourse = function(courseName) {
      var confirm = uibM.open({
         templateUrl: 'Courses/confirmDelete.html',
         scope: scope,
         size: 'sm'
      });
      confirm.result.then(function(confirmed) {
         if (confirmed) {
            $http.delete('Crss/' + courseName)
            .then(function(res) {
               return scope.refreshCrss();
            });
         }
      })
   };

   scope.viewCourse = function(courseName) {
      $state.go('crs', { courseName: courseName });
   };
}])
