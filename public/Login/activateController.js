app.controller('activateController',
['$scope', '$state', '$stateParams', 'login', '$rootScope', 'toasterror', 'api',
function(scope, $state, $stateParams, login, $rootScope, toastr, API) {
   $rootScope.page = 'activate';

   scope.user = {};

   scope.activate = function() {
      API.prss.activate($stateParams.token)
      .then(function() {
         // $state.go('home');
      })
      .catch(function(err) {
         toastr.error('Incorrect token...');
      });
   };
}])
