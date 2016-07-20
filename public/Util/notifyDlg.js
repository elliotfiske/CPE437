// Declare a service that allows an error message.
app.service("notifyDlg", ["$uibModal", function(uibM) {
   return {
      show: function(scp, msg, hdr) {
         scp.msg = msg;
         scp.hdr = hdr;
         return uibM.open({
            templateUrl: 'Util/notifyDlg.template.html',
            scope: scp,
            size: 'sm'
         }).result;
      }
   };
}]);
