app.controller('crsController',
['$scope', '$state', '$stateParams', '$http', 'attStateFilter', '$uibModal', 'login',
 function(scope, $state, $stateParams, $http, attStateFilter, uibM, login) {
   scope.courseName = $stateParams.courseName;

   if (!scope.loggedUser) {
      $state.go('home');
   }

   scope.refreshEnrs = function() {
      return $http.get("Crss/" + scope.courseName + "/Enrs?full=true")
         .then(function(response) {
            scope.enrs = response.data;
         });
   };

   scope.refreshEnrs();

   scope.addEnrollment = function() {
      if (!scope.email)
         return;

      // Get prsId
      $http.get('Prss?email=' + scope.email)
      .then(function(res) {
         if (res.data.length === 0) {
            scope.errors = ['No user found for that email'];
         }
         else {
            return $http.post('Crss/' + scope.courseName + '/Enrs', {
               prsId: res.data[0].id
            }).then(function(data) {
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
      var confirm = uibM.open({
         templateUrl: 'Courses/confirmDelete.html',
         scope: scope,
         size: 'sm'
      });
      confirm.result.then(function(confirmed) {
         if (confirmed) {
            $http.delete('Crss/' + scope.courseName + '/Enrs/' + enrId)
            .then(function(res) {
               return scope.refreshEnrs();
            });
         }
      })
   };
}])
