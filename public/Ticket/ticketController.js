app.controller('ticketController',
 ['$scope', '$state', '$stateParams', 'login', '$rootScope', 'API', 'toasterror', function(scope, $state, $stateParams, login, $rootScope, API, toastr) {
   $rootScope.page = 'ticket';

   console.log("Ticket time! Logging you in with", $stateParams.ticket);
   // Make call to our backend to validate ticket.

   API.validate.post($stateParams.ticket).then(function(response) {
      if (window.smartlook) {
         smartlook('tag', 'email', response.data.email);
      }

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
   })
   .catch(toastr.doErrorMessage(function(err) {}));
}])
