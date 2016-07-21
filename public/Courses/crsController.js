app.controller('crsController',
['$scope', '$state', '$stateParams', 'api', 'confirm', 'login',
 function(scope, $state, $stateParams, API, confirm, login) {
   scope.courseName = $stateParams.courseName;

   scope.challenge = { courseName: scope.courseName };

   if (!login.isLoggedIn()) {
      $state.go('home');
   }

   scope.refreshEnrs = function() {
      return API.Crss.Enrs.get(scope.courseName)
         .then(function(response) {
            scope.enrs = response.data;
         });
   };

   scope.refreshEnrs();

   scope.refreshChls = function() {
      return API.Crss.Chls.get(scope.courseName)
         .then(function(response) {
            scope.chls = response.data;
         });
   };

   scope.refreshChls();

   scope.addEnrollment = function() {
      if (!scope.email)
         return;

      // Get prsId
      API.Prss.find(scope.email)
         .then(function(response) {
            var data = response.data;
            if (data.length === 0) {
               scope.errors = ['No user found for that email'];
            }
            else {
               return API.Crss.Enrs.post(scope.courseName, data[0].id)
                  .then(function(data) {
                     return scope.refreshEnrs();
                  });
            }
         })
         .catch(function(err) {
            if (err.data[0].tag === 'dupName') {
               scope.errors = ['User already enrolled'];
            }
            else
               scope.errors = err.data;
         });
   };

   scope.deleteEnrollment = function(enrId) {
      confirm(function() {
         API.Crss.Enrs.delete(scope.courseName, enrId)
            .then(function(res) {
               return scope.refreshEnrs();
            });
      });
   };

   scope.createChallenge = function() {
      API.Chls.post(scope.challenge)
         .then(scope.refreshChls);
   }
}])
