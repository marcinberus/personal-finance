(function () {
  'use strict';

  angular.module('pfApp').config([
    '$httpProvider',
    function ($httpProvider) {
      $httpProvider.interceptors.push('AuthInterceptor');
    },
  ]);
})();
