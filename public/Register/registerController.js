app.controller('registerController', ['$scope', '$state', '$http', 'login', '$rootScope', function(scope, $state, $http, login, $rootScope) {
   $rootScope.page = 'register';

   scope.user = {role: 0};
   scope.errors = [];

   scope.register = function() {
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
