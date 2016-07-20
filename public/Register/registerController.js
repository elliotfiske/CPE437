app.controller('registerController', ['$scope', '$state', '$http', function(scope, $state, $http) {
   scope.user = {role: 0};

   scope.registerUser = function() {
      $http.post("Prss", scope.user)
      .then(function(response) {
         $state.go('login');
      });
   }
}])
