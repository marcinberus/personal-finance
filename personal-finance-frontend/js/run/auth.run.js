(function () {
  'use strict';

  angular.module('pfApp').run([
    '$rootScope',
    '$location',
    '$window',
    'AuthSessionService',
    'LocalizationService',
    function (
      $rootScope,
      $location,
      $window,
      AuthSessionService,
      LocalizationService,
    ) {
      LocalizationService.init();

      $rootScope.$on('$routeChangeStart', function (_event, next) {
        if (
          next &&
          next.requiresAuth &&
          !AuthSessionService.isAuthenticated()
        ) {
          $window.location.assign('/login');
          return;
        }

        if (
          AuthSessionService.isAuthenticated() &&
          ($location.path() === '/login' || $location.path() === '/register')
        ) {
          $location.path('/dashboard');
        }
      });
    },
  ]);
})();
