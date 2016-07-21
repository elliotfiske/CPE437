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
         get: get($http, 'Crss'),
         delete: function(courseName) {
            return $http.delete('Crss/' + courseName);
         }
      }
   }])
   .service('challenges', ['$http', function($http) {
      return {
         get: get($http, 'Chls')
      }
   }])
   .service('enrollments', ['$http', function($http) {
      return {
         get: function(courseName) {
            return $http.get("Crss/" + courseName + "/Enrs?full=true")
               .then(function(response) {
                  return response.data;
               });
         },
         create: function(courseName, prsId) {
            return $http.post('Crss/' + courseName + '/Enrs', { prsId: prsId });
         }
      }
   }])
   .service('person', ['$http', function($http) {
      return {
         get: function(email) {
            return $http.get('Prss?email=' + email)
               .then(function(res) {
                  return res.data;
               });
         }
      }
   }]);

})();