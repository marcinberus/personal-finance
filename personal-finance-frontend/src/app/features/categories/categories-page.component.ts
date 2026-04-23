import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
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
  private readonly cdr = inject(ChangeDetectorRef);

  protected categories: Category[] = [];
  protected filterType: '' | CategoryType = '';

  protected form: CategoryPayload = {
    name: '',
    type: 'expense',
  };

  protected loading = false;
  protected creating = false;
  protected errorMessage = '';

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.categoriesApiService
      .listCategories(this.filterType || undefined)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (err: unknown) => {
          this.errorMessage = toAppError(err, 'Failed to load categories.').message;
        },
      });
  }

  protected create(formRef: NgForm): void {
    if (formRef.invalid) {
      return;
    }

    this.creating = true;
    this.errorMessage = '';

    this.categoriesApiService
      .createCategory(this.form)
      .pipe(
        finalize(() => {
          this.creating = false;
          this.cdr.markForCheck();
        }),
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
            this.categories = [createdCategory, ...this.categories];
          }
        },
        error: (err: unknown) => {
          this.errorMessage = toAppError(err, 'Failed to create category.').message;
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
