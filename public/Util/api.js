(function() {
   function get($http, url) {
      return function() {
         return $http.get(url)
            .then(function(response) {
               return response.data;
            })
            .catch(function(err) {
               console.log(err ? "Error" + JSON.stringify(err) : "Cancelled");
            });
      };
   }

   angular.module('mainApp')
   .service('attempts', ['$http', function($http) {
      return {
         get: function(prsId) {

         },
         start: function(prsId, challengeName) {
            return $http.post("Prss/" + prsId + "/Atts", { challengeName: challengeName.trim('') })
               .catch(function(err) {
                  console.log(err ? "Error" + JSON.stringify(err) : "Cancelled");
               });
         }
      }
   }])
   .service('courses', ['$http', function($http) {
      return {
         get: get($http, 'Crss')
      }
   }])
   .service('challenges', ['$http', function($http) {
      return {
         get: get($http, 'Chls')
      }
   }]);

})();