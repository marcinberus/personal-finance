import { Injectable } from '@angular/core';
import { LedgerSummary, MonthlyReport } from './dashboard-api.service';

@Injectable({ providedIn: 'root' })
export class DashboardRefreshService {
  lastRefreshedAt = 0;
  summary: LedgerSummary | null = null;
  monthlyReport: MonthlyReport | null = null;
}
