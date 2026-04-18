import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

export type CategoryType = 'income' | 'expense';

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
};

export type CategoryPayload = {
  name: string;
  type: CategoryType;
};

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly ledgerBaseUrl = 'http://localhost:3001/api';

  listCategories(type?: CategoryType): Observable<Category[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<Category[]>(`${this.ledgerBaseUrl}/categories`, { params }).pipe(
      map((items) => items.map((item) => this.normalizeCategory(item))),
      catchError((error) => this.handleHttpError(error, 'Failed to load categories.')),
    );
  }

  createCategory(payload: CategoryPayload): Observable<Category> {
    const request: CategoryPayload = {
      name: payload.name.trim(),
      type: payload.type,
    };

    if (!request.name || request.name.length > 100) {
      return throwError(
        () => new Error('Category name is required and must be at most 100 characters.'),
      );
    }

    if (request.type !== 'income' && request.type !== 'expense') {
      return throwError(() => new Error('Category type must be income or expense.'));
    }

    return this.http.post<Category>(`${this.ledgerBaseUrl}/categories`, request).pipe(
      map((item) => this.normalizeCategory(item)),
      catchError((error) => this.handleHttpError(error, 'Failed to create category.')),
    );
  }

  private normalizeCategory(item: Category): Category {
    return {
      ...item,
      name: (item.name ?? '').trim(),
      type: item.type === 'income' ? 'income' : 'expense',
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
