app.controller('homeController', ['$scope', '$state', 'login', '$rootScope', function(scope, state, login, $rootScope) {
   $rootScope.page = 'home';

   scope.goToAttempts = function() {
      state.go('student');
   }

   scope.goToCourses = function() {
      state.go('crss', {prsId: scope.loggedUser.id});
   }

}])
