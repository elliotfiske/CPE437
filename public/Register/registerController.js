app.controller('registerController', ['$scope', '$state', '$http', function(scope, $state, $http) {
   scope.user = {role: 0};
   scope.errors = [];

   scope.registerUser = function() {
      $http.post("Prss", scope.user)
      .then(function(response) {
         $state.go('login');
      })
      .catch(function(response) {
         scope.errors = response.data;
      });
   }

   scope.goBack = function() {
      $state.go('home');
   }
}])
