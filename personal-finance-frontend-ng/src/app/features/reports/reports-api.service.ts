import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

export type MonthlyReport = {
  year: number;
  month?: number | null;
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
};

export type CategorySpendItem = {
  categoryId: string;
  categoryName: string;
  total: number;
};

export type MonthlyReportQuery = {
  year: number | string;
  month?: number | string | null;
};

export type CategorySpendQuery = {
  year: number | string;
  month: number | string;
};

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly reportingBaseUrl = 'http://localhost:3002/api';

  getMonthly(query: MonthlyReportQuery): Observable<MonthlyReport> {
    const year = this.normalizeYear(query.year);
    const month = this.normalizeOptionalMonth(query.month);

    let params = new HttpParams().set('year', String(year));
    if (month !== null) {
      params = params.set('month', String(month));
    }

    return this.http
      .get<MonthlyReport>(`${this.reportingBaseUrl}/reports/monthly`, { params })
      .pipe(catchError((error) => this.handleHttpError(error, 'Failed to load monthly report.')));
  }

  getCategorySpend(query: CategorySpendQuery): Observable<CategorySpendItem[]> {
    const year = this.normalizeYear(query.year);
    const month = this.normalizeRequiredMonth(query.month);

    const params = new HttpParams().set('year', String(year)).set('month', String(month));

    return this.http
      .get<CategorySpendItem[]>(`${this.reportingBaseUrl}/reports/category-spend`, { params })
      .pipe(catchError((error) => this.handleHttpError(error, 'Failed to load category spend.')));
  }

  private normalizeYear(value: number | string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
      throw new Error('Year must be an integer between 2000 and 2100.');
    }

    return parsed;
  }

  private normalizeOptionalMonth(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) {
      throw new Error('Month must be an integer between 1 and 12.');
    }

    return parsed;
  }

  private normalizeRequiredMonth(value: number | string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) {
      throw new Error('Month must be an integer between 1 and 12.');
    }

    return parsed;
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
