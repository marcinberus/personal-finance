(function () {
  'use strict';

  angular.module('pfApp').run([
    '$rootScope',
    '$location',
    'AuthSessionService',
    'LocalizationService',
    function ($rootScope, $location, AuthSessionService, LocalizationService) {
      LocalizationService.init();

      $rootScope.$on('$routeChangeStart', function (_event, next) {
        if (
          next &&
          next.requiresAuth &&
          !AuthSessionService.isAuthenticated()
        ) {
          $location.path('/login');
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
