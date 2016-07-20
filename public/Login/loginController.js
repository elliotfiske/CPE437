app.controller('loginController',
 ['$scope', '$state', '$http', 'notifyDlg', 'login', function(scope, $state, $http, nDlg, login) {

   scope.user = {};

   scope.login = function() {
      login.login(scope.user.email, scope.user.password)
      .then(function() {
         $state.go('atts', {prsId: scope.loggedUser.id});
      })
   }

   scope.goBack = function() {
      $state.go('home');
   }
}])
