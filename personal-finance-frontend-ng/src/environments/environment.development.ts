export const environment = {
  production: false,
  api: {
    identityBaseUrl: 'http://localhost:3000/api',
    ledgerBaseUrl: 'http://localhost:3001/api',
    reportingBaseUrl: 'http://localhost:3002/api',
  },
  storageKeys: {
    authToken: 'pf_access_token',
    authUser: 'pf_user',
    locale: 'pf.locale',
  },
  localization: {
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
  },
} as const;
