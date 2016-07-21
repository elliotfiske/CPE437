app.controller('loginController',
 ['$scope', '$state', '$http', 'notifyDlg', 'login', '$rootScope', function(scope, $state, $http, nDlg, login, $rootScope) {
   $rootScope.page = 'login';

   scope.user = {};

   scope.login = function() {
      login.login(scope.user.email, scope.user.password)
      .then(function() {
         $state.go('student');
      })
   }

   scope.goBack = function() {
      $state.go('home');
   }
}])
