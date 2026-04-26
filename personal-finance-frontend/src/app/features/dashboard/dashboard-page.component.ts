import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
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
  imports: [LocalizedCurrencyPipe],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css'],
})
export class DashboardPageComponent implements OnInit {
  private readonly dashboardApiService = inject(DashboardApiService);
  private readonly refreshService = inject(DashboardRefreshService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly now = new Date();
  protected readonly currentYear = this.now.getFullYear();
  protected readonly currentMonth = this.now.getMonth() + 1;

  protected readonly summary = signal<LedgerSummary | null>(null);
  protected readonly monthlyReport = signal<MonthlyReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly nextRefreshIn = signal(AUTO_REFRESH_INTERVAL_MS / 1000);

  constructor() {
    if (this.refreshService.summary()) {
      this.summary.set(this.refreshService.summary());
      this.monthlyReport.set(this.refreshService.monthlyReport());
    } else {
      this.reload();
    }
  }

  ngOnInit(): void {
    this.nextRefreshIn.set(this.computeInitialNextRefreshIn());
    this.startAutoRefresh();
  }

  protected reload(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      summary: this.dashboardApiService.getSummary(),
      monthlyReport: this.dashboardApiService.getMonthly(this.currentYear, this.currentMonth),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ summary, monthlyReport }) => {
          this.summary.set(summary);
          this.monthlyReport.set(monthlyReport);
          this.refreshService.summary.set(summary);
          this.refreshService.monthlyReport.set(monthlyReport);
          this.refreshService.lastRefreshedAt.set(Date.now());
          this.nextRefreshIn.set(AUTO_REFRESH_INTERVAL_MS / 1000);
        },
        error: (err: unknown) => {
          this.errorMessage.set(toAppError(err, 'Failed to load dashboard.').message);
        },
      });
  }

  private computeInitialNextRefreshIn(): number {
    if (this.refreshService.lastRefreshedAt() === 0) {
      return AUTO_REFRESH_INTERVAL_MS / 1000;
    }
    const elapsedSeconds = Math.floor((Date.now() - this.refreshService.lastRefreshedAt()) / 1000);
    return Math.max(1, AUTO_REFRESH_INTERVAL_MS / 1000 - elapsedSeconds);
  }

  private startAutoRefresh(): void {
    const tickInterval = setInterval(() => {
      this.nextRefreshIn.update((v) => v - 1);

      if (this.nextRefreshIn() <= 0) {
        this.reload();
      }
    }, 1000);

    this.destroyRef.onDestroy(() => clearInterval(tickInterval));
  }
}
