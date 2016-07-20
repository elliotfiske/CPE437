
app.config(['$stateProvider', '$urlRouterProvider',
   function($stateProvider, $router) {

      //redirect to home if path is not matched
      $router.otherwise("/");

      $stateProvider
      .state('home',  {
         url: '/',
         templateUrl: 'Home/home.template.html',
         controller: 'homeController',
      })
      .state('register', {
         url: '/register',
         templateUrl: 'Register/register.template.html',
         controller: 'registerController',
      })
      .state('login', {
         url: '/login',
         templateUrl: 'Login/login.template.html',
         controller: 'loginController',
      })
      .state('atts', {
         url: '/Prss/{prsId}',
         templateUrl: 'Attempts/atts.template.html',
         controller: 'attsController',
         resolve: {
            atts: ['$q', '$http', '$stateParams', function($q, http, prms) {
               return http.get('/Prss/' + prms.prsId + "/Atts")
               .then(function(response) {
                  return $q.resolve(response.data)
               });
            }]
         }
      })
   }]);
