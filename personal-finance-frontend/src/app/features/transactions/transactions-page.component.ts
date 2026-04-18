import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Category } from '../categories/categories-api.service';
import { LocalizedCurrencyPipe } from '../../shared/localization/localized-currency.pipe';
import {
  CreateTransactionPayload,
  Transaction,
  TransactionFilters,
  TransactionsApiService,
} from './transactions-api.service';

@Component({
  standalone: true,
  selector: 'app-transactions-page',
  imports: [CommonModule, FormsModule, LocalizedCurrencyPipe],
  templateUrl: './transactions-page.component.html',
  styleUrls: ['./transactions-page.component.css'],
})
export class TransactionsPageComponent {
  private readonly transactionsApiService = inject(TransactionsApiService);

  protected categories: Category[] = [];
  protected transactions: Transaction[] = [];

  protected filters: TransactionFilters = {
    type: undefined,
    categoryId: '',
    from: '',
    to: '',
  };

  protected form: CreateTransactionPayload = {
    categoryId: '',
    amount: 0,
    type: 'expense',
    description: '',
    transactionDate: this.toDateInputString(new Date()),
  };

  protected loadingCategories = false;
  protected loadingTransactions = false;
  protected creating = false;
  protected deletingId: string | null = null;
  protected errorMessage = '';

  constructor() {
    this.loadCategories();
    this.loadTransactions();
  }

  protected loadCategories(): void {
    this.loadingCategories = true;
    this.errorMessage = '';

    this.transactionsApiService
      .listCategories()
      .pipe(finalize(() => (this.loadingCategories = false)))
      .subscribe({
        next: (categories) => {
          this.categories = categories;

          if (!this.form.categoryId && categories.length > 0) {
            this.form.categoryId = categories[0].id;
          }
        },
        error: (err: unknown) => {
          this.errorMessage = this.getErrorMessage(err, 'Failed to load categories.');
        },
      });
  }

  protected loadTransactions(): void {
    this.loadingTransactions = true;
    this.errorMessage = '';

    this.transactionsApiService
      .listTransactions({
        type: this.filters.type,
        categoryId: this.filters.categoryId || undefined,
        from: this.filters.from || undefined,
        to: this.filters.to || undefined,
      })
      .pipe(finalize(() => (this.loadingTransactions = false)))
      .subscribe({
        next: (transactions) => {
          this.transactions = transactions;
        },
        error: (err: unknown) => {
          this.errorMessage = this.getErrorMessage(err, 'Failed to load transactions.');
        },
      });
  }

  protected create(formRef: NgForm): void {
    if (formRef.invalid) {
      return;
    }

    this.creating = true;
    this.errorMessage = '';

    this.transactionsApiService
      .createTransaction({
        categoryId: this.form.categoryId,
        amount: Number(this.form.amount),
        type: this.form.type,
        description: this.form.description,
        transactionDate: this.form.transactionDate,
      })
      .pipe(finalize(() => (this.creating = false)))
      .subscribe({
        next: () => {
          this.form.amount = 0;
          this.form.description = '';
          this.form.transactionDate = this.toDateInputString(new Date());
          formRef.form.markAsPristine();
          formRef.form.markAsUntouched();
          this.loadTransactions();
        },
        error: (err: unknown) => {
          this.errorMessage = this.getErrorMessage(err, 'Failed to create transaction.');
        },
      });
  }

  protected remove(id: string): void {
    this.deletingId = id;
    this.errorMessage = '';

    this.transactionsApiService
      .deleteTransaction(id)
      .pipe(finalize(() => (this.deletingId = null)))
      .subscribe({
        next: () => {
          this.transactions = this.transactions.filter((item) => item.id !== id);
        },
        error: (err: unknown) => {
          this.errorMessage = this.getErrorMessage(err, 'Failed to delete transaction.');
        },
      });
  }

  protected trackByCategoryId(_index: number, category: Category): string {
    return category.id;
  }

  protected trackByTransactionId(_index: number, transaction: Transaction): string {
    return transaction.id;
  }

  private toDateInputString(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().substring(0, 10);
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (!err || typeof err !== 'object') {
      return fallback;
    }

    const maybeError = err as { message?: string; error?: { message?: string } };
    return maybeError.error?.message ?? maybeError.message ?? fallback;
  }
}
