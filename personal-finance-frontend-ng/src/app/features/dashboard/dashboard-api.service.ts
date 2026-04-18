import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

export type LedgerSummary = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  userEmail: string;
};

export type MonthlyReport = {
  year: number;
  month?: number | null;
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
};

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);

  private readonly ledgerBaseUrl = 'http://localhost:3001/api';
  private readonly reportingBaseUrl = 'http://localhost:3002/api';

  getSummary(): Observable<LedgerSummary> {
    return this.http.get<LedgerSummary>(`${this.ledgerBaseUrl}/transactions/summary`).pipe(
      map((summary) => this.normalizeSummary(summary)),
      catchError((error) => this.handleHttpError(error, 'Failed to load ledger summary.')),
    );
  }

  getMonthly(year: number, month: number): Observable<MonthlyReport> {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return throwError(() => new Error('Year must be an integer between 2000 and 2100.'));
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return throwError(() => new Error('Month must be an integer between 1 and 12.'));
    }

    const params = new HttpParams().set('year', String(year)).set('month', String(month));

    return this.http
      .get<MonthlyReport>(`${this.reportingBaseUrl}/reports/monthly`, { params })
      .pipe(
        map((report) => this.normalizeMonthlyReport(report)),
        catchError((error) => this.handleHttpError(error, 'Failed to load monthly report.')),
      );
  }

  private normalizeSummary(summary: LedgerSummary): LedgerSummary {
    return {
      totalIncome: Number(summary.totalIncome ?? 0),
      totalExpenses: Number(summary.totalExpenses ?? 0),
      balance: Number(summary.balance ?? 0),
      userEmail: (summary.userEmail ?? '').trim(),
    };
  }

  private normalizeMonthlyReport(report: MonthlyReport): MonthlyReport {
    return {
      year: Number(report.year ?? 0),
      month: report.month ?? null,
      incomeTotal: Number(report.incomeTotal ?? 0),
      expenseTotal: Number(report.expenseTotal ?? 0),
      balance: Number(report.balance ?? 0),
    };
  }

  private handleHttpError(error: unknown, fallback: string) {
    if (error instanceof HttpErrorResponse) {
      const message =
        (error.error as { message?: string } | null)?.message ??
        error.message ??
        error.statusText ??
        fallback;
      return throwError(() => new Error(message));
    }

    if (error instanceof Error) {
      return throwError(() => error);
    }

    return throwError(() => new Error(fallback));
  }
}
