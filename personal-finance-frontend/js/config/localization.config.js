(function () {
  'use strict';

  angular.module('pfApp').constant('LocalizationConfig', {
    defaultLocale: 'en-US',
    defaultCurrency: 'USD',
    localeCurrencyMap: {
      'en-US': 'USD',
      'en-GB': 'GBP',
      'de-DE': 'EUR',
      'fr-FR': 'EUR',
      'it-IT': 'EUR',
      'es-ES': 'EUR',
      'pl-PL': 'PLN',
      en: 'USD',
      de: 'EUR',
      fr: 'EUR',
      it: 'EUR',
      es: 'EUR',
      pl: 'PLN',
    },
  });
})();
