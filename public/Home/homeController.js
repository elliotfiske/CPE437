app.controller('homeController', ['$scope', '$state', function(scope, state) {

   scope.goToLogin = function() {
      state.go('login');
   }

   scope.goToRegister = function() {
      state.go('register');
   }

}])
