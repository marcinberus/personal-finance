import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { toAppError } from '../../shared/api/http-error.util';
import {
  Category,
  CategoryPayload,
  CategoryType,
  CategoriesApiService,
} from './categories-api.service';

@Component({
  standalone: true,
  selector: 'app-categories-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.css'],
})
export class CategoriesPageComponent {
  private readonly categoriesApiService = inject(CategoriesApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = signal<Category[]>([]);
  protected filterType: '' | CategoryType = '';

  protected form: CategoryPayload = {
    name: '',
    type: 'expense',
  };

  protected readonly loading = signal(false);
  protected readonly creating = signal(false);
  protected readonly errorMessage = signal('');

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.categoriesApiService
      .listCategories(this.filterType || undefined)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
        },
        error: (err: unknown) => {
          this.errorMessage.set(toAppError(err, 'Failed to load categories.').message);
        },
      });
  }

  protected create(formRef: NgForm): void {
    if (formRef.invalid) {
      return;
    }

    this.creating.set(true);
    this.errorMessage.set('');

    this.categoriesApiService
      .createCategory(this.form)
      .pipe(
        finalize(() => this.creating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (createdCategory) => {
          this.form = {
            name: '',
            type: 'expense',
          };
          formRef.resetForm(this.form);

          if (!this.filterType || this.filterType === createdCategory.type) {
            this.categories.update((list) => [createdCategory, ...list]);
          }
        },
        error: (err: unknown) => {
          this.errorMessage.set(toAppError(err, 'Failed to create category.').message);
        },
      });
  }

  protected onFilterChanged(): void {
    this.load();
  }

  protected trackByCategoryId(_index: number, category: Category): string {
    return category.id;
  }
}
