app.controller('crsController',
['$scope', '$state', '$stateParams', 'api', 'confirm', 'login', '$location',
function(scope, $state, $stateParams, API, confirm, login, $location) {
   scope.courseName = $stateParams.courseName;

   scope.challenge = {
      courseName: scope.courseName,
      attsAllowed: 5,
      openTime: new Date()
   };

   if (!login.isLoggedIn()) {
      $state.go('login');
   }

   scope.refreshenrs = function() {
      return API.crss.enrs.get(scope.courseName)
      .then(function(response) {
         scope.enrs = response.data;
      });
   };

   scope.refreshenrs();

   scope.refreshchls = function() {
      return API.crss.challenge.get(scope.courseName)
      .then(function(response) {
         scope.weeks = response.data;
         scope.weeks.sort(function(a, b) {
            return a.weekIndexInCourse - b.weekIndexInCourse;
         });
      });
   };

   scope.refreshchls();

   scope.refreshitms = function() {
      return API.crss.itms.get(scope.courseName)
      .then(function(response) {
         scope.itms = response.data;
      });
   };

   scope.makingitm = false;
   scope.newitm = {};

   scope.createitm = function() {
      scope.makingitm = false;
      API.crss.itms.post(scope.courseName, scope.newitm)
      .then(scope.refreshitms)
      .catch(function(err) {
         scope.shopErrors = ["There's already an item named " + scope.newitm.name];
      });
   }

   scope.deleteitm = function(itmId) {
      API.crss.itms.delete(scope.courseName, itmId)
      .then(scope.refreshitms)
      .catch(function(err) {
         scope.shopErrors = ["Error deleting item"];
      });
   }

   scope.refreshitms();

   scope.isOpen = function(chl) {
      if (scope.loggedUser.role == 0) {
         return chl.openTime <= new Date();
      }
      else {
         return true;
      }
   }

   scope.addEnrollment = function() {
      if (!scope.email)
      return;

      // Get prsId
      API.prss.find(scope.email)
      .then(function(response) {
         var data = response.data;
         if (data.length === 0) {
            scope.errors = ['No user found for that email'];
         }
         else {
            return API.crss.enrs.post(scope.courseName, data[0].id)
            .then(function(data) {
               return scope.refreshenrs();
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
         API.crss.enrs.delete(scope.courseName, enrId)
         .then(function(res) {
            return scope.refreshenrs();
         });
      });
   };

   scope.createChallenge = function() {
      $state.go('newchallenge', {courseName: scope.courseName, week: 0, day: 0, type: "multchoice" });
   }

   scope.viewChallenge = function(challengeName) {
      $state.go('challenge', { courseName: scope.courseName, challengeName: challengeName});
   }
}])
