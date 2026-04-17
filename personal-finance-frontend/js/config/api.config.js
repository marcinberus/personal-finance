(function () {
  'use strict';

  angular.module('pfApp').constant('ApiConfig', {
    identityBaseUrl: 'http://localhost:3000/api',
    ledgerBaseUrl: 'http://localhost:3001/api',
    reportingBaseUrl: 'http://localhost:3002/api',
  });
})();
