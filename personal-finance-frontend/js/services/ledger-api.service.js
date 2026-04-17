(function () {
  'use strict';

  angular.module('pfApp').factory('LedgerApiService', [
    '$http',
    'ApiConfig',
    function ($http, ApiConfig) {
      return {
        getSummary: function () {
          return $http.get(ApiConfig.ledgerBaseUrl + '/transactions/summary');
        },
        listCategories: function (type) {
          var params = type ? { params: { type: type } } : undefined;
          return $http.get(ApiConfig.ledgerBaseUrl + '/categories', params);
        },
        createCategory: function (payload) {
          return $http.post(ApiConfig.ledgerBaseUrl + '/categories', payload);
        },
        listTransactions: function (query) {
          return $http.get(ApiConfig.ledgerBaseUrl + '/transactions', {
            params: query,
          });
        },
        createTransaction: function (payload) {
          return $http.post(ApiConfig.ledgerBaseUrl + '/transactions', payload);
        },
        deleteTransaction: function (id) {
          return $http.delete(ApiConfig.ledgerBaseUrl + '/transactions/' + id);
        },
      };
    },
  ]);
})();
