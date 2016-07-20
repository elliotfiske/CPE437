app.controller('homeController', ['$scope', '$state', 'login', function(scope, state, login) {

   scope.goToLogin = function() {
      state.go('login');
   }

   scope.goToRegister = function() {
      state.go('register');
   }

   scope.goToAttempts = function() {
      state.go('atts', {prsId: scope.loggedUser.id});
   }

   scope.goToCourses = function() {
      state.go('crss', {prsId: scope.loggedUser.id});
   }

}])
