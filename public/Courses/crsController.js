app.controller('crsController',
['$scope', '$state', '$stateParams', '$http', 'attStateFilter', 'confirm', 'login', 'enrollments', 'person',
 function(scope, $state, $stateParams, $http, attStateFilter, confirm, login, enrollments, person) {
   scope.courseName = $stateParams.courseName;

   if (!login.isLoggedIn()) {
      $state.go('home');
   }

   scope.refreshEnrs = function() {
      return enrollments.get(scope.courseName)
         .then(function(data) {
            scope.enrs = data;
         });
   };

   scope.refreshEnrs();

   scope.addEnrollment = function() {
      if (!scope.email)
         return;

      // Get prsId
      person.get(scope.email)
         .then(function(data) {
            if (data.length === 0) {
               scope.errors = ['No user found for that email'];
            }
            else {
               return enrollments.create(scope.courseName, data[0].id)
                  .then(function(data) {
                     return scope.refreshEnrs();
                  });
            }
         })
         .catch(function(err) {
            if (err.data[0].tag === 'dupName') {
               scope.errors = ['User already enrolled'];
            }
            else
               scope.errors = err.data;
         });
   };

   scope.deleteEnrollment = function(enrId) {
      confirm(function() {
         $http.delete('Crss/' + scope.courseName + '/Enrs/' + enrId)
            .then(function(res) {
               return scope.refreshEnrs();
            });
      });
   };
}])
