app.controller('registerController', ['$scope', '$state', '$rootScope', 'api', function(scope, $state, $rootScope, API) {
   $rootScope.page = 'register';

   scope.user = {role: 0};
   scope.errors = [];

   scope.register = function() {
      if (!scope.user.email.endsWith("@calpoly.edu")) {
         scope.user.email += "@calpoly.edu";
      }
      
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
