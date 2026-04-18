import { Injectable } from '@angular/core';

type LocalizationConfig = {
  defaultLocale: string;
  defaultCurrency: string;
  localeCurrencyMap: Record<string, string>;
};

@Injectable({ providedIn: 'root' })
export class LocalizationService {
  private static readonly STORAGE_KEY = 'pf.locale';

  private readonly config: LocalizationConfig = {
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
  };

  private state = {
    locale: this.config.defaultLocale,
    currency: this.config.defaultCurrency,
  };

  private initialized = false;

  init(): void {
    if (this.initialized) {
      return;
    }

    const savedLocale = this.readStoredLocale();
    this.setLocale(savedLocale || this.detectBrowserLocale());
    this.initialized = true;
  }

  setLocale(locale: string): void {
    const normalized = this.normalizeLocale(locale);
    const candidates = this.buildCandidates(normalized);
    const selectedLocale = candidates.length > 0 ? candidates[0] : this.config.defaultLocale;

    this.state.locale = selectedLocale;
    this.state.currency = this.resolveCurrency(selectedLocale);
    this.persistLocale(selectedLocale);
  }

  getLocale(): string {
    this.init();
    return this.state.locale;
  }

  getCurrency(): string {
    this.init();
    return this.state.currency;
  }

  private normalizeLocale(rawLocale: string | null | undefined): string {
    if (!rawLocale || typeof rawLocale !== 'string') {
      return this.config.defaultLocale;
    }

    return rawLocale.replace('_', '-');
  }

  private buildCandidates(locale: string): string[] {
    const normalized = this.normalizeLocale(locale);
    const parts = normalized.split('-');
    const language = (parts[0] || '').toLowerCase();
    const region = (parts[1] || '').toUpperCase();
    const result: string[] = [];

    if (language && region) {
      result.push(`${language}-${region}`);
    }

    if (language) {
      result.push(language);
    }

    return result;
  }

  private resolveCurrency(locale: string): string {
    const candidates = this.buildCandidates(locale);

    for (const candidate of candidates) {
      const mappedCurrency = this.config.localeCurrencyMap[candidate];
      if (mappedCurrency) {
        return mappedCurrency;
      }
    }

    return this.config.defaultCurrency;
  }

  private detectBrowserLocale(): string {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const browserLocales = Array.isArray(nav?.languages)
      ? nav.languages
      : [nav?.language || this.config.defaultLocale];

    return this.normalizeLocale(browserLocales[0]);
  }

  private persistLocale(locale: string): void {
    try {
      localStorage.setItem(LocalizationService.STORAGE_KEY, locale);
    } catch {
      // Ignore storage failures in restricted environments.
    }
  }

  private readStoredLocale(): string | null {
    try {
      return localStorage.getItem(LocalizationService.STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
