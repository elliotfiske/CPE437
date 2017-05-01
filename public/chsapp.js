
var app = angular.module('mainApp', [
   'ui.router',
   'ui.bootstrap',
   'ngAnimate',
   'toastr',
   'ngTagsInput',
   'ngSanitize'
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
.service('toasterror', ['toastr', '$state', function(toastr, $state) {
   toastr.doErrorMessage = function(callback) {
      return function(err) {
         console.warn("Error! " + err);

         if (err.data.tag === "noLogin") {
            $state.go('home');
         }
         else if (err.data.humanMessage) {
            toastr.error(err.data.humanMessage, 'Oh no!');
         }
         else {
            callback(err);
         }

      };
   };

   return toastr;
}])
.service('login', ['$rootScope', 'api', '$state', function($rootScope, API, $state) {
   if (localStorage.user) {
      $rootScope.loggedUser = JSON.parse(localStorage.user);
      API.prss.get($rootScope.loggedUser.id)
      .then(function(response) {
         var user = response.data;
         $rootScope.loggedUser = user;
         if (window.smartlook) smartlook('tag', 'email', user.email);
      })
      .catch($rootScope.logout);
   }

   $rootScope.logout = function(goToLogin) {
      $rootScope.loggedUser = null;
      delete localStorage.user;
      if (goToLogin) {
         $state.go('home');
      }
      globalCache = {};
   };

   // This should go somewhere else, if I ever cared.
   $rootScope.goHome = function() {
      $state.go('home');
   };

   return {
      login: function(email, password) {
         return API.Ssns.post({ email: email, password: password })
         .then(function(response) {
            var location = response.headers().location.split('/');
            return API.Ssns.get(location[location.length - 1]);
         })
         .then(function(response) {
            if (window.smartlook) smartlook('tag', 'email', email);
            return API.prss.get(response.data.prsId);
         })
         .then(function(reponse) {
            var user = reponse.data;
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

Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
}

globalCache = localStorage.getObject("cache");

function getFromCache(key) {
   if (!globalCache) {
      return null;
   }

   return globalCache[key];
}

function saveToCache(key, value) {
   if (!globalCache) {
      globalCache = {};
   }

   globalCache[key] = value;

   localStorage.setObject("cache", globalCache);
}
