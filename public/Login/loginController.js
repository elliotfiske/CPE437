app.controller('loginController',
 ['$scope', '$state', 'login', '$rootScope', function(scope, $state, login, $rootScope) {
   $rootScope.page = 'login';

   scope.user = {};

   scope.login = function() {
      login.login(scope.user.email, scope.user.password)
      .then(function() {
         $state.go('teacher');
      })
      .catch(function(err) {
         scope.error = 'Login failed';
      });
   }

   scope.goBack = function() {
      $state.go('teacher');
   }
}])
