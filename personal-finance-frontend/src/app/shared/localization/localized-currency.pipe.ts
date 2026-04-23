import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocalizationService } from './localization.service';

@Pipe({
  name: 'localizedCurrency',
  standalone: true,
})
export class LocalizedCurrencyPipe implements PipeTransform {
  private readonly localizationService = inject(LocalizationService);

  transform(input: unknown): unknown {
    if (input === null || input === undefined || input === '') {
      return '';
    }

    const value = Number(input);
    if (Number.isNaN(value)) {
      return input;
    }

    const locale = this.localizationService.getLocale();
    const currency = this.localizationService.getCurrency();

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  }
}
