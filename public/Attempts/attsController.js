app.controller('attsController',
['$scope', '$state', '$http', 'attStateFilter', '$uibModal', 'login',
 function(scope, $state, $http, attStateFilter, uibM, login) {
   scope.atts = {};

   if (!scope.loggedUser) {
      $state.go('home');
   }

   scope.refreshAtts = function() {
      return $http.get("Prss/" + scope.loggedUser.id + "/Atts")
         .then(function(response) {
            // Group attempts by challenge name
            var grouped = {};
            scope.inProgress = {};

            angular.forEach(response.data, function(attempt) {
               var chl = attempt.challengeName;
               grouped[chl] = grouped[chl] || [];
               scope.inProgress[chl] = scope.inProgress[chl] || attempt.state === 2;

               grouped[chl].push(attempt);
            });

            scope.atts = grouped;
         });
   };

   scope.refreshAtts();

   scope.startNewAtt = function(chl) {
      var promise = { then: function(cb) { return cb(chl); } };

      if (!chl) { 
         promise = $http.get("/Chls")
         .then(function(res) {
            scope.challenges = res.data.map(function(val){return val.name;});
            return uibM.open({
               templateUrl: 'Attempts/pickChlDlg.html',
               scope: scope,
               size: 'sm'
            }).result;
         });
      }
      
      promise.then(function(res) {
         console.log("Making new attempt on " + res);
         return $http.post("Prss/" + scope.loggedUser.id + "/Atts", {challengeName: res.trim('')});
      })
      .then(function(res) {
         console.log("Att post yields " + res.headers("Location"));
         return scope.refreshAtts();
      })
      .catch(function(err) {
         console.log(err ? "Error" + JSON.stringify(err) : "Cancelled");
      });
   };

   scope.checkAtt = function(attId) {
      console.log("Check att " + attId);
   }

   scope.getAttColor = function(att) {
      var styles = ['bg-success', 'bg-warning', 'bg-danger'];

      return styles[att.state] || "";
   }
}])
