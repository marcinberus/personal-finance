import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../../shared/api/api-endpoints';
import { toAppError } from '../../shared/api/http-error.util';
import { Category, CategoryType } from '../categories/categories-api.service';

export type Transaction = {
  id: string;
  categoryId: string;
  amount: number;
  type: CategoryType;
  description: string | null;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    type: CategoryType;
  };
};

export type TransactionFilters = {
  type?: CategoryType;
  categoryId?: string;
  from?: string;
  to?: string;
};

export type CreateTransactionPayload = {
  categoryId: string;
  amount: number;
  type: CategoryType;
  description?: string;
  transactionDate: string;
};

@Injectable({ providedIn: 'root' })
export class TransactionsApiService {
  private readonly http = inject(HttpClient);
  private readonly ledgerBaseUrl = API_ENDPOINTS.ledgerBaseUrl;

  listCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.ledgerBaseUrl}/categories`).pipe(
      map((items) => items.map((item) => this.normalizeCategory(item))),
      catchError((error) => throwError(() => toAppError(error, 'Failed to load categories.'))),
    );
  }

  listTransactions(filters: TransactionFilters): Observable<Transaction[]> {
    let params = new HttpParams();

    if (filters.type) {
      params = params.set('type', filters.type);
    }

    if (filters.categoryId) {
      params = params.set('categoryId', filters.categoryId);
    }

    if (filters.from) {
      params = params.set('from', filters.from);
    }

    if (filters.to) {
      params = params.set('to', filters.to);
    }

    return this.http.get<Transaction[]>(`${this.ledgerBaseUrl}/transactions`, { params }).pipe(
      map((items) => items.map((item) => this.normalizeTransaction(item))),
      catchError((error) => throwError(() => toAppError(error, 'Failed to load transactions.'))),
    );
  }

  createTransaction(payload: CreateTransactionPayload): Observable<Transaction> {
    const request = this.normalizeCreatePayload(payload);

    return this.http.post<Transaction>(`${this.ledgerBaseUrl}/transactions`, request).pipe(
      map((item) => this.normalizeTransaction(item)),
      catchError((error) => throwError(() => toAppError(error, 'Failed to create transaction.'))),
    );
  }

  deleteTransaction(id: string): Observable<void> {
    if (!id) {
      return throwError(() => new Error('Transaction id is required.'));
    }

    return this.http
      .delete<void>(`${this.ledgerBaseUrl}/transactions/${id}`)
      .pipe(
        catchError((error) => throwError(() => toAppError(error, 'Failed to delete transaction.'))),
      );
  }

  private normalizeCreatePayload(payload: CreateTransactionPayload): CreateTransactionPayload {
    const categoryId = (payload.categoryId ?? '').trim();
    const description = (payload.description ?? '').trim();
    const amount = Number(payload.amount);

    if (!categoryId) {
      throw new Error('Category is required.');
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Amount must be greater than 0.');
    }

    if (payload.type !== 'income' && payload.type !== 'expense') {
      throw new Error('Type must be income or expense.');
    }

    if (description.length > 500) {
      throw new Error('Description must be at most 500 characters.');
    }

    if (!payload.transactionDate) {
      throw new Error('Transaction date is required.');
    }

    return {
      categoryId,
      amount,
      type: payload.type,
      description,
      transactionDate: payload.transactionDate,
    };
  }

  private normalizeCategory(item: Category): Category {
    return {
      ...item,
      name: (item.name ?? '').trim(),
      type: item.type === 'income' ? 'income' : 'expense',
    };
  }

  private normalizeTransaction(item: Transaction): Transaction {
    return {
      ...item,
      amount: Number(item.amount),
      type: item.type === 'income' ? 'income' : 'expense',
      description: item.description ?? '',
      category: {
        ...item.category,
        type: item.category?.type === 'income' ? 'income' : 'expense',
      },
    };
  }
}
