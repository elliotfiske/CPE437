app.controller('activateController',
['$scope', '$state', '$stateParams', 'login', '$rootScope', 'toasterror', 'api',
function(scope, $state, $stateParams, login, $rootScope, toastr, API) {
   $rootScope.page = 'activation';

   scope.user = {};

   scope.activationError = null;

   scope.activate = function() {
      // If there's already a user, log 'em out.
      $rootScope.logout(false);

      API.prss.activate({token: $stateParams.token, checkedDisclaimer: scope.checkarino})
      .then(function() {
         $state.go('login');
         toastr.success("Log in to get started!", "Congratulations! You're activated :)")
      })
      .catch(toastr.doErrorMessage(function(err) {
         // whatever
      }));
   };
}])
