(function () {
  'use strict';

  angular.module('pfApp').factory('AuthSessionService', [
    '$window',
    '$http',
    'ApiConfig',
    function ($window, $http, ApiConfig) {
      var tokenKey = 'pf_access_token';
      var userKey = 'pf_user';

      function saveSession(payload) {
        $window.localStorage.setItem(tokenKey, payload.accessToken);
        $window.localStorage.setItem(userKey, JSON.stringify(payload.user));
      }

      function clearSession() {
        $window.localStorage.removeItem(tokenKey);
        $window.localStorage.removeItem(userKey);
      }

      return {
        login: function (credentials) {
          return $http
            .post(ApiConfig.identityBaseUrl + '/auth/login', credentials)
            .then(function (res) {
              saveSession(res.data);
              return res.data;
            });
        },
        register: function (payload) {
          return $http
            .post(ApiConfig.identityBaseUrl + '/auth/register', payload)
            .then(function (res) {
              saveSession(res.data);
              return res.data;
            });
        },
        me: function () {
          return $http.get(ApiConfig.identityBaseUrl + '/auth/me');
        },
        getToken: function () {
          return $window.localStorage.getItem(tokenKey);
        },
        getUser: function () {
          var value = $window.localStorage.getItem(userKey);
          if (!value) {
            return null;
          }

          try {
            return JSON.parse(value);
          } catch (_err) {
            $window.localStorage.removeItem(userKey);
            return null;
          }
        },
        isAuthenticated: function () {
          var hasToken = !!$window.localStorage.getItem(tokenKey);
          var hasUser = !!this.getUser();

          if (hasToken && !hasUser) {
            clearSession();
          }

          return hasToken && hasUser;
        },
        logout: function () {
          clearSession();
        },
      };
    },
  ]);
})();
