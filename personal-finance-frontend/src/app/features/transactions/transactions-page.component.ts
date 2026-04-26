import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { toAppError } from '../../shared/api/http-error.util';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LocalizedCurrencyPipe],
  templateUrl: './transactions-page.component.html',
  styleUrls: ['./transactions-page.component.css'],
})
export class TransactionsPageComponent {
  private readonly transactionsApiService = inject(TransactionsApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = signal<Category[]>([]);
  protected readonly transactions = signal<Transaction[]>([]);

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

  protected readonly loadingCategories = signal(false);
  protected readonly loadingTransactions = signal(false);
  protected readonly creating = signal(false);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly errorMessage = signal('');

  constructor() {
    this.loadCategories();
    this.loadTransactions();
  }

  protected loadCategories(): void {
    this.loadingCategories.set(true);
    this.errorMessage.set('');

    this.transactionsApiService
      .listCategories()
      .pipe(
        finalize(() => this.loadingCategories.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);

          if (!this.form.categoryId && categories.length > 0) {
            this.form.categoryId = categories[0].id;
          }
        },
        error: (err: unknown) => {
          this.errorMessage.set(toAppError(err, 'Failed to load categories.').message);
        },
      });
  }

  protected loadTransactions(): void {
    this.loadingTransactions.set(true);
    this.errorMessage.set('');

    this.transactionsApiService
      .listTransactions({
        type: this.filters.type,
        categoryId: this.filters.categoryId || undefined,
        from: this.filters.from || undefined,
        to: this.filters.to || undefined,
      })
      .pipe(
        finalize(() => this.loadingTransactions.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (transactions) => {
          this.transactions.set(transactions);
        },
        error: (err: unknown) => {
          this.errorMessage.set(toAppError(err, 'Failed to load transactions.').message);
        },
      });
  }

  protected create(formRef: NgForm): void {
    if (formRef.invalid) {
      return;
    }

    this.creating.set(true);
    this.errorMessage.set('');

    this.transactionsApiService
      .createTransaction({
        categoryId: this.form.categoryId,
        amount: Number(this.form.amount),
        type: this.form.type,
        description: this.form.description,
        transactionDate: this.form.transactionDate,
      })
      .pipe(
        finalize(() => this.creating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.form.amount = 0;
          this.form.description = '';
          this.form.transactionDate = this.toDateInputString(new Date());
          formRef.resetForm(this.form);
          this.loadTransactions();
        },
        error: (err: unknown) => {
          this.errorMessage.set(toAppError(err, 'Failed to create transaction.').message);
        },
      });
  }

  protected remove(id: string): void {
    this.deletingId.set(id);
    this.errorMessage.set('');

    this.transactionsApiService
      .deleteTransaction(id)
      .pipe(
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.transactions.update((list) => list.filter((item) => item.id !== id));
        },
        error: (err: unknown) => {
          this.errorMessage.set(toAppError(err, 'Failed to delete transaction.').message);
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
}
