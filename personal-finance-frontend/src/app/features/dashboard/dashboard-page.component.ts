import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LocalizedCurrencyPipe } from '../../shared/localization/localized-currency.pipe';
import { DashboardApiService, LedgerSummary, MonthlyReport } from './dashboard-api.service';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule, LocalizedCurrencyPipe],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css'],
})
export class DashboardPageComponent {
  private readonly dashboardApiService = inject(DashboardApiService);

  protected readonly now = new Date();
  protected readonly currentYear = this.now.getFullYear();
  protected readonly currentMonth = this.now.getMonth() + 1;

  protected summary: LedgerSummary | null = null;
  protected monthlyReport: MonthlyReport | null = null;
  protected loading = false;
  protected errorMessage = '';

  constructor() {
    this.reload();
  }

  protected reload(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      summary: this.dashboardApiService.getSummary(),
      monthlyReport: this.dashboardApiService.getMonthly(this.currentYear, this.currentMonth),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ summary, monthlyReport }) => {
          this.summary = summary;
          this.monthlyReport = monthlyReport;
        },
        error: (err: unknown) => {
          this.errorMessage = this.getErrorMessage(err, 'Failed to load dashboard.');
        },
      });
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (!err || typeof err !== 'object') {
      return fallback;
    }

    const maybeError = err as { message?: string; error?: { message?: string } };
    return maybeError.error?.message ?? maybeError.message ?? fallback;
  }
}
