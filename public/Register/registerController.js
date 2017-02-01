app.controller('registerController', ['$scope', '$state', '$rootScope', 'api', 'toasterror', function(scope, $state, $rootScope, API, toastr) {
   $rootScope.page = 'register';

   scope.user = {role: 0};
   scope.errors = [];

   scope.register = function() {
      if (!scope.user.email.endsWith("@calpoly.edu")) {
         scope.user.email += "@calpoly.edu";
      }

      API.prss.post(scope.user)
      .then(function(response) {
         toastr.success("Check your email! You should receive a link to activate your account.", "Awesome!")
         $state.go('login');
      })
      .catch(toastr.doErrorMessage(function(err) {}));
   }

   scope.goBack = function() {
      $state.go('home');
   }
}])
