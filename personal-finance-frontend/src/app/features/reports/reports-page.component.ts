import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
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
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly now = new Date();

  protected monthlyQuery = {
    year: this.now.getFullYear(),
    month: this.now.getMonth() + 1,
  };

  protected categoryQuery = {
    year: this.now.getFullYear(),
    month: this.now.getMonth() + 1,
  };

  protected monthly: MonthlyReport | null = null;
  protected categorySpend: CategorySpendItem[] = [];

  protected monthlyLoading = false;
  protected categoryLoading = false;
  protected errorMessage = '';

  constructor() {
    this.loadMonthly();
    this.loadCategorySpend();
  }

  protected loadMonthly(): void {
    this.monthlyLoading = true;
    this.errorMessage = '';

    const query: { year: number; month?: number } = {
      year: this.monthlyQuery.year,
    };

    if (this.monthlyQuery.month) {
      query.month = this.monthlyQuery.month;
    }

    this.reportsApiService
      .getMonthly(query)
      .pipe(
        finalize(() => {
          this.monthlyLoading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.monthly = result;
        },
        error: (err: unknown) => {
          this.errorMessage = toAppError(err, 'Failed to load monthly report.').message;
        },
      });
  }

  protected loadCategorySpend(): void {
    this.categoryLoading = true;
    this.errorMessage = '';

    this.reportsApiService
      .getCategorySpend(this.categoryQuery)
      .pipe(
        finalize(() => {
          this.categoryLoading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.categorySpend = result;
        },
        error: (err: unknown) => {
          this.errorMessage = toAppError(err, 'Failed to load category spend.').message;
        },
      });
  }

  protected trackByCategoryId(_index: number, item: CategorySpendItem): string {
    return item.categoryId;
  }
}
