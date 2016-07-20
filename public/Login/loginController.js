app.controller('loginController',
 ['$scope', '$state', '$http', 'notifyDlg', function(scope, $state, $http, nDlg) {

   scope.user = {};

   scope.login = function() {
      $http.post("Ssns", scope.user)
      .then(function(response) {
         var location = response.headers().location.split('/');
         return $http.get("Ssns/" + location[location.length - 1]);
      })
      .then(function(response) {
         $state.go('atts', {prsId: response.data.prsId});
      })
      .catch(function(err) {
         nDlg.show(scope, "Login failed", "Error").then(function() {console.log("Done")});
      });
   }
}])
