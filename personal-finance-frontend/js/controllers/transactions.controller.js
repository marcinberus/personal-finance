(function () {
  'use strict';

  angular.module('pfApp').controller('TransactionsPageController', [
    'LedgerApiService',
    function (LedgerApiService) {
      var vm = this;

      function toDateInputString(value) {
        if (!value) {
          return undefined;
        }

        var date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
          return undefined;
        }

        return date.toISOString().substring(0, 10);
      }

      vm.categories = [];
      vm.transactions = [];
      vm.filters = {
        type: '',
        categoryId: '',
        from: '',
        to: '',
      };
      vm.form = {
        categoryId: '',
        amount: null,
        type: 'expense',
        description: '',
        transactionDate: new Date(),
      };

      vm.loadCategories = function () {
        LedgerApiService.listCategories().then(function (res) {
          vm.categories = res.data;
        });
      };

      vm.loadTransactions = function () {
        var query = angular.copy(vm.filters);
        query.from = toDateInputString(query.from);
        query.to = toDateInputString(query.to);

        Object.keys(query).forEach(function (key) {
          if (!query[key]) {
            delete query[key];
          }
        });

        LedgerApiService.listTransactions(query).then(function (res) {
          vm.transactions = res.data;
        });
      };

      vm.create = function () {
        var payload = angular.copy(vm.form);
        payload.amount = Number(payload.amount);
        payload.transactionDate = toDateInputString(payload.transactionDate);
        LedgerApiService.createTransaction(payload).then(function () {
          vm.form.amount = null;
          vm.form.description = '';
          vm.form.transactionDate = new Date();
          vm.loadTransactions();
        });
      };

      vm.remove = function (id) {
        LedgerApiService.deleteTransaction(id).then(function () {
          vm.loadTransactions();
        });
      };

      vm.loadCategories();
      vm.loadTransactions();
    },
  ]);
})();
