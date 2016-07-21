angular.module('mainApp')
.service('confirm', ['$uibModal', function($uibModal) {
   return function(onConfirm, onReject) {
      return $uibModal.open({
         templateUrl: 'Util/confirm.html',
         size: 'sm'
      }).result.then(function(confirmed) {
         if (confirmed) {
            onConfirm();
         }
         else if (onReject) {
            onReject();
         }
      });
   }
}]);
