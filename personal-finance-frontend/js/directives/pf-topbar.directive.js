(function () {
  'use strict';

  angular.module('pfApp').directive('pfTopbar', function () {
    return {
      restrict: 'E',
      scope: {
        user: '<',
        isAuthenticated: '<',
        onLogout: '&',
      },
      templateUrl: 'templates/layout/topbar.directive.html',
    };
  });
})();
