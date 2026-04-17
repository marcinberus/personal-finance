(function () {
  'use strict';

  angular.module('pfApp').controller('DashboardPageController', [
    '$q',
    'LedgerApiService',
    'ReportingApiService',
    function ($q, LedgerApiService, ReportingApiService) {
      var vm = this;
      var now = new Date();
      vm.currentYear = now.getFullYear();
      vm.currentMonth = now.getMonth() + 1;
      vm.summary = null;
      vm.monthlyReport = null;
      vm.loading = true;

      function loadSummary() {
        return LedgerApiService.getSummary().then(function (res) {
          vm.summary = res.data;
        });
      }

      function loadMonthly() {
        return ReportingApiService.getMonthly({
          year: vm.currentYear,
          month: vm.currentMonth,
        }).then(function (res) {
          vm.monthlyReport = res.data;
        });
      }

      vm.reload = function () {
        vm.loading = true;
        $q.all([loadSummary(), loadMonthly()]).finally(function () {
          vm.loading = false;
        });
      };

      vm.reload();
    },
  ]);
})();
