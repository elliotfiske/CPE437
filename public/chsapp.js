
var app = angular.module('mainApp', [
   'ui.router',
   'ui.bootstrap'
])
.filter("attState", function(){
   var stateNames = ["Done", "Quit", "Working"];

   return function(input) {
      return stateNames[input];
   };
})
.service('login', ['$rootScope', 'notifyDlg', '$http', '$state', function($rootScope, nDlg, $http, $state){
   $rootScope.loggedUser = null;

   if (localStorage.user) {
      $rootScope.loggedUser = JSON.parse(localStorage.user);
      $http.get('Prss/' + $rootScope.loggedUser.id)
      .then(function(response) {
         var user = response.data[0];
         $rootScope.loggedUser = user;
         return user;
      })
      .catch(function() {
         $rootScope.loggedUser = null;
         delete localStorage.user;
         $state.go('home');
      });
   }

   $rootScope.logout = function() {
      $rootScope.loggedUser = null;
      $state.go('home');
      delete localStorage.user;
   };

   return {
      login: function(email, password) {
         return $http.post("Ssns", { email: email, password: password })
            .then(function(response) {
               var location = response.headers().location.split('/');
               return $http.get("Ssns/" + location[location.length - 1]);
            })
            .then(function(response) {
               return $http.get("Prss/" + response.data.prsId);
            })
            .then(function(reponse) {
               var user = reponse.data[0];
               localStorage.user = JSON.stringify(user);
               $rootScope.loggedUser = user;
               return user;
            });
      },
      logout: $rootScope.logout,
      isLoggedIn: function() {
         return !!$rootScope.loggedUser;
      }
   };
}]);
