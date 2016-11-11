
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
         url: '/prss/{prsId}/crss',
         templateUrl: 'Courses/crss.template.html',
         controller: 'crssController'
      })
      .state('crs', {
         url: '/crss/{courseName}',
         templateUrl: 'Courses/crs.template.html',
         controller: 'crsController'
      })
      .state('newchl', {
         url: '/crss/{courseName}/newchl?w={week}&d={day}',
         templateUrl: 'Challenges/newchl.template.html',
         controller: 'newchlController'
      })
      .state('chl', {
         url: '/chls/{challengeName}',
         templateUrl: 'Challenges/chl.template.html',
         controller: 'chlController'
      })
      .state('student', {
         url: '/student',
         templateUrl: 'Student/student.template.html',
         controller: 'studentController'
      })
      .state('teacher', {
         url: '/teacher',
         templateUrl: 'Teacher/teacher.template.html',
         controller: 'teacherController'
      })
   }]);
