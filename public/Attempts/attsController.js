app.controller('attsController',
['$scope', '$state', '$http', 'attStateFilter', 'atts', '$uibModal',
 function(scope, $state, $http, attStateFilter, atts, uibM) {
   scope.atts = atts;

   scope.startNewAtt = function() {
      console.log("Start new attempt");
   }

   scope.checkAtt = function(attId) {
      console.log("Check att " + attId);
   }

   scope.getAttColor = function(att) {
      var styles = ['panel-success', 'panel-warning', 'panel-danger'];

      return styles[att.state] || "";
   }
}])
