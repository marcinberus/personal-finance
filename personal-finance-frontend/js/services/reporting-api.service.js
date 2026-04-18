(function () {
  'use strict';

  angular.module('pfApp').factory('ReportingApiService', [
    '$http',
    'ApiConfig',
    function ($http, ApiConfig) {
      return {
        getMonthly: function (query) {
          return $http.get(ApiConfig.reportingBaseUrl + '/reports/monthly', {
            params: query,
          });
        },
        getCategorySpend: function (query) {
          return $http.get(
            ApiConfig.reportingBaseUrl + '/reports/category-spend',
            {
              params: query,
            },
          );
        },
      };
    },
  ]);
})();
