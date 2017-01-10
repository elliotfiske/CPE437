app.controller('activateController',
['$scope', '$state', '$stateParams', 'login', '$rootScope', 'toasterror', 'api',
function(scope, $state, $stateParams, login, $rootScope, toastr, API) {
   $rootScope.page = 'activation';

   scope.user = {};

   scope.activationError = null;

   scope.activate = function() {
      // If there's already a user, log 'em out.
      $rootScope.logout(false);

      API.prss.activate({token: $stateParams.token, name: scope.user.name, password: scope.user.password})
      .then(function() {
         $state.go('login');
      })
      .catch(toastr.doErrorMessage(function(err) {
         scope.activationError = err;
      }));
   };
}])
