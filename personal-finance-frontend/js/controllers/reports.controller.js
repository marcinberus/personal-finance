(function () {
  'use strict';

  angular.module('pfApp').controller('ReportsPageController', [
    'ReportingApiService',
    function (ReportingApiService) {
      var vm = this;
      var now = new Date();
      vm.monthlyQuery = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      };
      vm.categoryQuery = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      };
      vm.monthly = null;
      vm.categorySpend = [];

      vm.loadMonthly = function () {
        var query = angular.copy(vm.monthlyQuery);
        if (!query.month) {
          delete query.month;
        }

        ReportingApiService.getMonthly(query).then(function (res) {
          vm.monthly = res.data;
        });
      };

      vm.loadCategorySpend = function () {
        ReportingApiService.getCategorySpend(vm.categoryQuery).then(
          function (res) {
            vm.categorySpend = res.data;
          },
        );
      };

      vm.loadMonthly();
      vm.loadCategorySpend();
    },
  ]);
})();
