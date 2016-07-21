angular.module('mainApp')
.service('api', ['$http', function($http) {
   function call(method, url, params) {
      return $http[method](url, params)
         .catch(function(err) {
            console.error(err ? "Error" + JSON.stringify(err) : "Cancelled");
         });
   }

   function get(url, params) { return call('get', url, params); }
   function post(url, params) { return call('post', url, params); }
   function put(url, params) { return call('put', url, params); }
   function del(url, params) { return call('delete', url, params); }

   function typicalGet(baseUrl) {
      return function(identifier) {
         identifier = identifier || '';
         // Will get baseUrl if nothing is passed
         return get(baseUrl + '/' + identifier);
      }
   }
   function typicalPost(baseUrl) {
      return function(body) {
         return post(baseUrl, body);
      }
   }
   function typicalPut(baseUrl) {
      return function(identifier, body) {
         identifier = identifier || '';
         return post(baseUrl + '/' + identifier, body);
      }
   }
   function typicalDelete(baseUrl) {
      return function(identifier) {
         identifier = identifier || '';
         // Will get baseUrl if nothing is passed
         return del(baseUrl + '/' + identifier);
      }
   }

   return {
      Prss: {
         get: typicalGet('Prss'),
         find: function(email) {
            return get('Prss?email=' + email);
         },
         post: typicalPost('Prss'),
         put: typicalPut('Prss'),
         delete: typicalDelete('Prss'),
         Atts: {
            get: function(prsId, challengeName) {
               return get('Prss/' + prsId + '/Atts' + (challengeName ? '?challengeName=' + challengeName : ''));
            },
            post: function(prsId, challengeName) {
               return post('Prss/' + prsId + '/Atts', { challengeName: challengeName });
            }
         },
         Crss: {
            get: function(prsId) {
               return get('Prss/' + prsId + '/Crss');
            }
         }
      },
      Ssns: {
         get: typicalGet('Ssns'),
         post: typicalPost('Ssns'),
         delete: typicalDelete('Ssns')
      },
      Chls: {
         get: typicalGet('Chls'),
         post: typicalPost('Chls'),
      },
      Crss: {
         post: typicalPost('Crss'),
         put: typicalPut('Crss'),
         delete: typicalDelete('Crss'),
         Enrs: {
            get: function(courseName, enrId) {
               enrId = enrId || '';
               return get('Crss/' + courseName + '/Enrs/' + enrId + '?full=true');
            },
            delete: function(courseName, enrId) {
               return del('Crss/' + courseName + '/Enrs/' + enrId);
            },
            post: function(courseName, prsId) {
               return post('Crss/' + courseName + '/Enrs', { prsId: prsId });
            }
         },
         Itms: {
            get: function(courseName, itemId) {
               itemId = itemId || '';
               return get('Crss/' + courseName + '/Itms/' + itemId);
            },
            post: function(courseName, body) {
               return post('Crss/' + courseName + '/Itms', body);
            },
            put: function(courseName, itemId, body) {
               return put('Crss/' + courseName + '/Itms/' + itemId, body);
            },
            delete: function(courseName, itemId) {
               return del('Crss/' + courseName + '/Itms/' + itemId);
            }
         }
      }
   }
}])