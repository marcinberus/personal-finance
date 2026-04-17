(function () {
  'use strict';

  angular.module('pfApp').factory('AuthInterceptor', [
    '$q',
    '$rootScope',
    'AuthSessionService',
    function ($q, $rootScope, AuthSessionService) {
      return {
        request: function (config) {
          var token = AuthSessionService.getToken();
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = 'Bearer ' + token;
          }
          return config;
        },
        responseError: function (rejection) {
          var message =
            (rejection.data && rejection.data.message) ||
            rejection.statusText ||
            'Request failed';
          $rootScope.$broadcast('api-error', message);
          if (rejection.status === 401) {
            AuthSessionService.logout();
          }
          return $q.reject(rejection);
        },
      };
    },
  ]);
})();
