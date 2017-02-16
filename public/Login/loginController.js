app.controller('loginController',
 ['$scope', '$state', 'login', '$rootScope', 'toasterror', function(scope, $state, login, $rootScope, toastr) {
   $rootScope.page = 'login';

   scope.user = {};

   scope.login = function() {
      login.login(scope.user.email, scope.user.password)
      .then(function() {
         $state.go('home');
      })
      .catch(toastr.doErrorMessage(function(err) {
         // whatever
      }));
   }

   scope.goBack = function() {
      $state.go('home');
   }
}])
