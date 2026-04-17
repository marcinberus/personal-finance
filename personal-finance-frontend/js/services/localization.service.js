(function () {
  'use strict';

  angular.module('pfApp').factory('LocalizationService', [
    '$window',
    'LocalizationConfig',
    function ($window, LocalizationConfig) {
      var STORAGE_KEY = 'pf.locale';
      var state = {
        locale: LocalizationConfig.defaultLocale,
        currency: LocalizationConfig.defaultCurrency,
      };

      function normalizeLocale(rawLocale) {
        if (!rawLocale || typeof rawLocale !== 'string') {
          return LocalizationConfig.defaultLocale;
        }

        return rawLocale.replace('_', '-');
      }

      function buildCandidates(locale) {
        var normalized = normalizeLocale(locale);
        var parts = normalized.split('-');
        var language = (parts[0] || '').toLowerCase();
        var region = (parts[1] || '').toUpperCase();
        var result = [];

        if (language && region) {
          result.push(language + '-' + region);
        }
        if (language) {
          result.push(language);
        }

        return result;
      }

      function resolveCurrency(locale) {
        var map = LocalizationConfig.localeCurrencyMap;
        var candidates = buildCandidates(locale);
        var i;

        for (i = 0; i < candidates.length; i += 1) {
          if (map[candidates[i]]) {
            return map[candidates[i]];
          }
        }

        return LocalizationConfig.defaultCurrency;
      }

      function detectBrowserLocale() {
        var browserLocales = [];
        if ($window.navigator && Array.isArray($window.navigator.languages)) {
          browserLocales = $window.navigator.languages;
        }

        if (!browserLocales.length && $window.navigator) {
          browserLocales = [
            $window.navigator.language ||
              $window.navigator.userLanguage ||
              LocalizationConfig.defaultLocale,
          ];
        }

        return normalizeLocale(browserLocales[0]);
      }

      function persistLocale(locale) {
        try {
          $window.localStorage.setItem(STORAGE_KEY, locale);
        } catch (_error) {
          // Ignore storage failures (e.g., private mode restrictions).
        }
      }

      function readStoredLocale() {
        try {
          return $window.localStorage.getItem(STORAGE_KEY);
        } catch (_error) {
          return null;
        }
      }

      function setLocale(locale) {
        var normalized = normalizeLocale(locale);
        var candidates = buildCandidates(normalized);
        var selectedLocale =
          candidates.length > 0
            ? candidates[0]
            : LocalizationConfig.defaultLocale;

        state.locale = selectedLocale;
        state.currency = resolveCurrency(selectedLocale);
        persistLocale(selectedLocale);
      }

      function init() {
        var savedLocale = readStoredLocale();
        setLocale(savedLocale || detectBrowserLocale());
      }

      return {
        init: init,
        setLocale: setLocale,
        getLocale: function () {
          return state.locale;
        },
        getCurrency: function () {
          return state.currency;
        },
      };
    },
  ]);
})();
