(function () {
  'use strict';

  angular.module('pfApp').factory('AuthInterceptor', [
    '$q',
    '$window',
    '$rootScope',
    function ($q, $window, $rootScope) {
      var tokenKey = 'pf_access_token';
      var userKey = 'pf_user';

      return {
        request: function (config) {
          var token = $window.localStorage.getItem(tokenKey);
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
            $window.localStorage.removeItem(tokenKey);
            $window.localStorage.removeItem(userKey);
          }
          return $q.reject(rejection);
        },
      };
    },
  ]);
})();
