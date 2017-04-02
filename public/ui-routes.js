app.config(function(toastrConfig) {
   angular.extend(toastrConfig, {
      autoDismiss: false,
      timeOut: 0,
      closeButton: true,
      tapToDismiss: false,
      onclick: function() {
         debugger;
      },
   })
});

app.config(['$stateProvider', '$urlRouterProvider',
   function($stateProvider, $router) {

      //redirect to home if path is not matched
      $router.otherwise("/");

      $stateProvider
      .state('home',  {
         url: '/?t={ticket}',
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
      .state('course', {
         url: '/course/{courseName}',
         templateUrl: 'Courses/crs.template.html',
         controller: 'crsController'
      })
      .state('courseAdmin', {
         url: '/course-admin/{courseName}',
         templateUrl: 'Courses/crs.teacher.template.html',
         controller: 'crsTeacherController'
      })
      .state('newchallenge', {
         url: '/course-admin/{courseName}/newchallenge?w={week}&d={day}',
         templateUrl: 'Challenges/newchl.template.html',
         controller: 'newchlController'
      })
      .state('challenge', {
         url: '/course/{courseName}/challenges/{challengeName}',
         templateUrl: 'Challenges/chl.template.html',
         controller: 'chlController'
      })
      .state('admin', {
         url: '/admin',
         templateUrl: 'Admin/admin.template.html',
         controller: 'adminController'
      })
      .state('activation', {
         url: '/activation?t={token}',
         templateUrl: 'Login/activate.template.html',
         controller: 'activateController'
      })
   }]);
