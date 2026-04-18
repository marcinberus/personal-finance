(function () {
  'use strict';

  angular.module('pfApp').controller('LoginPageController', [
    '$location',
    '$rootScope',
    'AuthSessionService',
    function ($location, $rootScope, AuthSessionService) {
      var vm = this;
      vm.form = {
        email: '',
        password: '',
      };
      vm.loading = false;

      vm.submit = function () {
        vm.loading = true;
        AuthSessionService.login(vm.form)
          .then(function () {
            $rootScope.$broadcast('auth-updated');
            $location.path('/dashboard');
          })
          .finally(function () {
            vm.loading = false;
          });
      };
    },
  ]);
})();
