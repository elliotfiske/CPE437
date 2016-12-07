
var app = angular.module('mainApp', [
   'ui.router',
   'ui.bootstrap',
   'ngAnimate',
   'toastr'
])
.filter("attState", function(){
   var stateNames = ["Done", "Quit", "Working"];

   return function(input) {
      return stateNames[input];
   };
})
.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
})
.service('elliot-toast', ['toastr', 'API', function(toastr, API) {
  toastr.doErrorMessage = function() {
      console.log("TODO: this thingy");
  }

  return toastr;
}])
.service('login', ['$rootScope', 'api', '$state', function($rootScope, API, $state){
   $rootScope.loggedUser = null;

   if (localStorage.user) {
      $rootScope.loggedUser = JSON.parse(localStorage.user);
      API.prss.get($rootScope.loggedUser.id)
         .then(function(response) {
            var user = response.data[0];
            $rootScope.loggedUser = user;
            return user;
         })
         .catch($rootScope.logout);
   }

   $rootScope.logout = function() {
      $rootScope.loggedUser = null;
      delete localStorage.user;
      $state.go('login');
   };

   return {
      login: function(email, password) {
         return API.Ssns.post({ email: email, password: password })
            .then(function(response) {
               var location = response.headers().location.split('/');
               return API.Ssns.get(location[location.length - 1]);
            })
            .then(function(response) {
               return API.prss.get(response.data.prsId);
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
