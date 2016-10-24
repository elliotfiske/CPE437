app.controller('registerController', ['$scope', '$state', '$rootScope', 'api', function(scope, $state, $rootScope, API) {
   $rootScope.page = 'register';

   scope.user = {role: 0};
   scope.errors = [];

   scope.register = function() {
      API.prss.post(scope.user)
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
