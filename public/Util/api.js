angular.module('mainApp')
.service('api', ['$http', '$rootScope', function($http, $rootScope) {
   function call(method, url, params) {
      return $http[method](url, params)
         .catch(function(err) {
            if (err.status === 401) {
               $rootScope.logout();
            }
            else {
               console.log(err ? "Error" + JSON.stringify(err) : "Cancelled");
            }

            throw err;
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
      prss: {
         get: typicalGet('prss'),
         find: function(email) {
            return get('prss?email=' + email);
         },
         post: typicalPost('prss'),
         put: typicalPut('prss'),
         delete: typicalDelete('prss'),
         atts: {
            get: function(prsId, challengeName) {
               return get('prss/' + prsId + '/atts' + (challengeName ? '?challengeName=' + challengeName : ''))
                  .then(function(response) {
                     response.data = response.data.map(function(att) {
                        att.startTime = new Date(att.startTime);
                        return att;
                     });
                     return response;
                  })
            },
            post: function(prsId, attempt) {
               return post('prss/' + prsId + '/atts', attempt);
            }
         },
         crss: {
            get: function(prsId) {
               return get('prss/' + prsId + '/crss');
            }
         },
         chls: {
            get: function(prsId) {
               return get('chls?prsId=' + prsId);
            }
         }
      },
      Ssns: {
         get: typicalGet('ssns'),
         post: typicalPost('ssns'),
         delete: typicalDelete('ssns')
      },
      chls: {
         post: typicalPost('chls'),
      },
      crss: {
         get: typicalGet('crss'),
         post: typicalPost('crss'),
         put: typicalPut('crss'),
         delete: typicalDelete('crss'),
         enrs: {
            get: function(courseName, enrId) {
               enrId = enrId || '';
               return get('crss/' + courseName + '/enrs/' + enrId + '?full=true');
            },
            delete: function(courseName, enrId) {
               return del('crss/' + courseName + '/enrs/' + enrId);
            },
            post: function(courseName, prsId) {
               return post('crss/' + courseName + '/enrs', { prsId: prsId });
            }
         },
         itms: {
            get: function(courseName, itemId) {
               itemId = itemId || '';
               return get('crss/' + courseName + '/itms/' + itemId);
            },
            post: function(courseName, body) {
               return post('crss/' + courseName + '/itms', body);
            },
            put: function(courseName, itemId, body) {
               return put('crss/' + courseName + '/itms/' + itemId, body);
            },
            delete: function(courseName, itemId) {
               return del('crss/' + courseName + '/itms/' + itemId);
            }
         },
         chls: {
            get: function(courseName, challengeName) {
               challengeName = challengeName || '';
               return get('crss/' + courseName + '/chls/' + challengeName).
                  then(function(response) {
                     response.data = response.data.map(function(chl) {
                        chl.openTime = new Date(chl.openTime);
                        return chl;
                     });
                     return response;
                  });
            }
         }
      }
   }
}])
