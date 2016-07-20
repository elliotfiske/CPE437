
var app = angular.module('mainApp', [
   'ui.router',
   'ui.bootstrap'
])
.filter("attState", function(){
   var stateNames = ["Done", "Quit", "Working"];

   return function(input) {
      return stateNames[input];
   };
});
