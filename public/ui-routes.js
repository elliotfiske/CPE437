
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
      .state('crss', {
         url: '/Prss/{prsId}/Crss',
         templateUrl: 'Courses/crss.template.html',
         controller: 'crssController'
      })
      .state('crs', {
         url: '/Crss/{courseName}',
         templateUrl: 'Courses/crs.template.html',
         controller: 'crsController'
      })
      .state('atts', {
         url: '/Prss/{prsId}',
         templateUrl: 'Attempts/atts.template.html',
         controller: 'attsController'
      })
   }]);
