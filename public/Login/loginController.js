app.controller('loginController',
 ['$scope', '$state', 'login', '$rootScope', 'toasterror', function(scope, $state, login, $rootScope, toastr) {
   $rootScope.page = 'login';

   scope.user = {};

   scope.login = function() {
      login.login(scope.user.email, scope.user.password)
      .then(function() {
         $state.go('home');
      })
      .catch(function(err) {
         if (err.data.tag == "notActivated") {
            toastr.info("The activation email takes a minute or two to show up. Thank you for your patience!", "You need to activate your account!");
         }
         else {
            if (err.data.humanMessage) {
               toastr.error(err.data.humanMessage, 'Oh no!');
            }
         }
      });
   }

   scope.goBack = function() {
      $state.go('home');
   }
}])
