app.controller('activateController',
 ['$scope', '$state', '$stateParams', 'login', '$rootScope', 'toastr',
  function(scope, $state, $stateParams, login, $rootScope, toastr) {
   $rootScope.page = 'activate';

   scope.user = {};

   API.prss.activate($stateParams.token)
   .then(function() {
      $state.go('home');
   })
   .catch(function(err) {
      toastr('Incorrect token...');
   });

   scope.login = function() {
      login.login(scope.user.email, scope.user.password)
      .then(function() {
         $state.go('home');
      })
      .catch(function(err) {
         scope.error = 'Login failed';
      });
   }

   scope.goBack = function() {
      $state.go('home');
   }
}])
