(function () {
  'use strict';

  angular.module('pfApp').directive('pfTopbar', function () {
    return {
      restrict: 'E',
      scope: {
        shell: '<',
        user: '<',
        isAuthenticated: '<',
        onLogout: '&',
      },
      templateUrl: 'templates/layout/topbar.directive.html',
    };
  });
})();
