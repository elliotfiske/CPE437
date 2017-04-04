app.controller('activateController',
['$scope', '$state', '$stateParams', 'login', '$rootScope', 'toasterror', 'api',
function(scope, $state, $stateParams, login, $rootScope, toastr, API) {
   $rootScope.page = 'activation';

   scope.user = {};

   scope.activate = function() {
      API.prss.activate({token: "calpoly", checkedDisclaimer: scope.checkarino})
      .then(function() {
         $rootScope.loggedUser.checkedDisclaimer = 1;
         $state.go('home');
         toastr.success("Have fun!", "Thank you!")
      })
      .catch(toastr.doErrorMessage(function(err) {
         // whatever
      }));
   };
}])
