import { Injectable, signal } from '@angular/core';
import { LedgerSummary, MonthlyReport } from './dashboard-api.service';

@Injectable({ providedIn: 'root' })
export class DashboardRefreshService {
  readonly lastRefreshedAt = signal(0);
  readonly summary = signal<LedgerSummary | null>(null);
  readonly monthlyReport = signal<MonthlyReport | null>(null);
}
