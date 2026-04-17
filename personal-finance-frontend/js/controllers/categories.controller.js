(function () {
  'use strict';

  angular.module('pfApp').controller('CategoriesPageController', [
    'LedgerApiService',
    function (LedgerApiService) {
      var vm = this;
      vm.categories = [];
      vm.filterType = '';
      vm.form = {
        name: '',
        type: 'expense',
      };

      vm.load = function () {
        LedgerApiService.listCategories(vm.filterType || undefined).then(
          function (res) {
            vm.categories = res.data;
          },
        );
      };

      vm.create = function () {
        LedgerApiService.createCategory(vm.form).then(function () {
          vm.form.name = '';
          vm.form.type = 'expense';
          vm.load();
        });
      };

      vm.load();
    },
  ]);
})();
