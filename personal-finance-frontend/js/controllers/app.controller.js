(function () {
  'use strict';

  angular.module('pfApp').controller('AppShellController', [
    '$location',
    '$scope',
    '$timeout',
    'AuthSessionService',
    function ($location, $scope, $timeout, AuthSessionService) {
      var vm = this;
      vm.user = AuthSessionService.getUser();
      vm.errorMessage = '';

      vm.isAuthenticated = function () {
        return AuthSessionService.isAuthenticated();
      };

      vm.isActive = function (path) {
        return $location.path() === path;
      };

      vm.logout = function () {
        AuthSessionService.logout();
        vm.user = null;
        $location.path('/login');
      };

      $scope.$on('auth-updated', function () {
        vm.user = AuthSessionService.getUser();
      });

      $scope.$on('api-error', function (_event, message) {
        vm.errorMessage = message;
        $timeout.cancel(vm.hideToastTimer);
        vm.hideToastTimer = $timeout(function () {
          vm.errorMessage = '';
        }, 3200);
      });
    },
  ]);
})();
