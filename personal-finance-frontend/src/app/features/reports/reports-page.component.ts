import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { toAppError } from '../../shared/api/http-error.util';
import { LocalizedCurrencyPipe } from '../../shared/localization/localized-currency.pipe';
import { CategorySpendItem, MonthlyReport, ReportsApiService } from './reports-api.service';

@Component({
  standalone: true,
  selector: 'app-reports-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LocalizedCurrencyPipe],
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.css'],
})
export class ReportsPageComponent {
  private readonly reportsApiService = inject(ReportsApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly now = new Date();

  protected monthlyQuery = {
    year: this.now.getFullYear(),
    month: this.now.getMonth() + 1,
  };

  protected categoryQuery = {
    year: this.now.getFullYear(),
    month: this.now.getMonth() + 1,
  };

  protected readonly monthly = signal<MonthlyReport | null>(null);
  protected readonly categorySpend = signal<CategorySpendItem[]>([]);

  protected readonly monthlyLoading = signal(false);
  protected readonly categoryLoading = signal(false);
  protected readonly errorMessage = signal('');

  constructor() {
    this.loadMonthly();
    this.loadCategorySpend();
  }

  protected loadMonthly(): void {
    this.monthlyLoading.set(true);
    this.errorMessage.set('');

    const query: { year: number; month?: number } = {
      year: this.monthlyQuery.year,
    };

    if (this.monthlyQuery.month) {
      query.month = this.monthlyQuery.month;
    }

    this.reportsApiService
      .getMonthly(query)
      .pipe(
        finalize(() => this.monthlyLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.monthly.set(result);
        },
        error: (err: unknown) => {
          this.errorMessage.set(toAppError(err, 'Failed to load monthly report.').message);
        },
      });
  }

  protected loadCategorySpend(): void {
    this.categoryLoading.set(true);
    this.errorMessage.set('');

    this.reportsApiService
      .getCategorySpend(this.categoryQuery)
      .pipe(
        finalize(() => this.categoryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.categorySpend.set(result);
        },
        error: (err: unknown) => {
          this.errorMessage.set(toAppError(err, 'Failed to load category spend.').message);
        },
      });
  }

  protected trackByCategoryId(_index: number, item: CategorySpendItem): string {
    return item.categoryId;
  }
}
