import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { CategorySpendItem, MonthlyReport, ReportsApiService } from './reports-api.service';

@Component({
  standalone: true,
  selector: 'app-reports-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.css'],
})
export class ReportsPageComponent {
  private readonly reportsApiService = inject(ReportsApiService);

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
      .pipe(finalize(() => (this.monthlyLoading = false)))
      .subscribe({
        next: (result) => {
          this.monthly = result;
        },
        error: (err: unknown) => {
          this.errorMessage = this.getErrorMessage(err, 'Failed to load monthly report.');
        },
      });
  }

  protected loadCategorySpend(): void {
    this.categoryLoading = true;
    this.errorMessage = '';

    this.reportsApiService
      .getCategorySpend(this.categoryQuery)
      .pipe(finalize(() => (this.categoryLoading = false)))
      .subscribe({
        next: (result) => {
          this.categorySpend = result;
        },
        error: (err: unknown) => {
          this.errorMessage = this.getErrorMessage(err, 'Failed to load category spend.');
        },
      });
  }

  protected trackByCategoryId(_index: number, item: CategorySpendItem): string {
    return item.categoryId;
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (!err || typeof err !== 'object') {
      return fallback;
    }

    const maybeError = err as { error?: { message?: string }; message?: string };
    return maybeError.error?.message ?? maybeError.message ?? fallback;
  }
}
