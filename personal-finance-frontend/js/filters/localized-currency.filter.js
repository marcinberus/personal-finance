(function () {
  'use strict';

  angular.module('pfApp').filter('localizedCurrency', [
    'LocalizationService',
    function (LocalizationService) {
      return function (input) {
        if (input === null || input === undefined || input === '') {
          return '';
        }

        var value = Number(input);
        if (Number.isNaN(value)) {
          return input;
        }

        try {
          return new Intl.NumberFormat(LocalizationService.getLocale(), {
            style: 'currency',
            currency: LocalizationService.getCurrency(),
          }).format(value);
        } catch (_error) {
          return value.toFixed(2) + ' ' + LocalizationService.getCurrency();
        }
      };
    },
  ]);
})();
