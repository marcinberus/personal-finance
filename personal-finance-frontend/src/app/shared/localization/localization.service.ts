import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LocalizationService {
  private readonly storageKey = environment.storageKeys.locale;
  private readonly config = environment.localization;

  private state: { locale: string; currency: string } = {
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
    const map = this.config.localeCurrencyMap as Record<string, string>;
    const candidates = this.buildCandidates(locale);

    for (const candidate of candidates) {
      const mappedCurrency = map[candidate];
      if (mappedCurrency) {
        return mappedCurrency;
      }
    }

    return this.config.defaultCurrency;
  }

  private detectBrowserLocale(): string {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const locale = nav?.languages[0] || nav?.language || this.config.defaultLocale;
    return this.normalizeLocale(locale);
  }

  private persistLocale(locale: string): void {
    try {
      localStorage.setItem(this.storageKey, locale);
    } catch {
      // Ignore storage failures in restricted environments.
    }
  }

  private readStoredLocale(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }
}
