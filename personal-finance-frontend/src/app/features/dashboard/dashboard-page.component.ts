import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LocalizedCurrencyPipe } from '../../shared/localization/localized-currency.pipe';
import { toAppError } from '../../shared/api/http-error.util';
import { DashboardApiService, LedgerSummary, MonthlyReport } from './dashboard-api.service';
import { DashboardRefreshService } from './dashboard-refresh.service';

const AUTO_REFRESH_INTERVAL_MS = 60_000;

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LocalizedCurrencyPipe],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css'],
})
export class DashboardPageComponent implements OnInit {
  private readonly dashboardApiService = inject(DashboardApiService);
  private readonly refreshService = inject(DashboardRefreshService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly now = new Date();
  protected readonly currentYear = this.now.getFullYear();
  protected readonly currentMonth = this.now.getMonth() + 1;

  protected summary: LedgerSummary | null = null;
  protected monthlyReport: MonthlyReport | null = null;
  protected loading = false;
  protected errorMessage = '';

  protected nextRefreshIn = AUTO_REFRESH_INTERVAL_MS / 1000;

  constructor() {
    if (this.refreshService.summary) {
      this.summary = this.refreshService.summary;
      this.monthlyReport = this.refreshService.monthlyReport;
    } else {
      this.reload();
    }
  }

  ngOnInit(): void {
    this.nextRefreshIn = this.computeInitialNextRefreshIn();
    this.startAutoRefresh();
  }

  protected reload(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      summary: this.dashboardApiService.getSummary(),
      monthlyReport: this.dashboardApiService.getMonthly(this.currentYear, this.currentMonth),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ summary, monthlyReport }) => {
          this.summary = summary;
          this.monthlyReport = monthlyReport;
          this.refreshService.summary = summary;
          this.refreshService.monthlyReport = monthlyReport;
          this.refreshService.lastRefreshedAt = Date.now();
          this.nextRefreshIn = AUTO_REFRESH_INTERVAL_MS / 1000;
        },
        error: (err: unknown) => {
          this.errorMessage = toAppError(err, 'Failed to load dashboard.').message;
        },
      });
  }

  private computeInitialNextRefreshIn(): number {
    if (this.refreshService.lastRefreshedAt === 0) {
      return AUTO_REFRESH_INTERVAL_MS / 1000;
    }
    const elapsedSeconds = Math.floor((Date.now() - this.refreshService.lastRefreshedAt) / 1000);
    return Math.max(1, AUTO_REFRESH_INTERVAL_MS / 1000 - elapsedSeconds);
  }

  private startAutoRefresh(): void {
    const tickInterval = setInterval(() => {
      this.nextRefreshIn -= 1;
      this.cdr.markForCheck();

      if (this.nextRefreshIn <= 0) {
        this.reload();
      }
    }, 1000);

    this.destroyRef.onDestroy(() => clearInterval(tickInterval));
  }
}
