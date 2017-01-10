app.controller('activateController',
['$scope', '$state', '$stateParams', 'login', '$rootScope', 'toasterror', 'api',
function(scope, $state, $stateParams, login, $rootScope, toastr, API) {
   $rootScope.page = 'activation';

   scope.user = {};

   scope.activationError = null;

   scope.activate = function() {
      // If there's already a user, log 'em out.
      $rootScope.logout(false);

      API.prss.activate($stateParams.token, scope.user)
      .then(function() {
         // $state.go('home');
      })
      .catch(function(err) {
         toastr.error('Incorrect token...');
         scope.activationError = err;
      });
   };
}])
