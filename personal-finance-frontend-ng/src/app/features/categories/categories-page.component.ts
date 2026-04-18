import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import {
  Category,
  CategoryPayload,
  CategoryType,
  CategoriesApiService,
} from './categories-api.service';

@Component({
  standalone: true,
  selector: 'app-categories-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.css'],
})
export class CategoriesPageComponent {
  private readonly categoriesApiService = inject(CategoriesApiService);

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
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (err: unknown) => {
          this.errorMessage = this.getErrorMessage(err, 'Failed to load categories.');
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
      .pipe(finalize(() => (this.creating = false)))
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
          this.errorMessage = this.getErrorMessage(err, 'Failed to create category.');
        },
      });
  }

  protected onFilterChanged(): void {
    this.load();
  }

  protected trackByCategoryId(_index: number, category: Category): string {
    return category.id;
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (!err || typeof err !== 'object') {
      return fallback;
    }

    const maybeError = err as { message?: string; error?: { message?: string } };
    return maybeError.error?.message ?? maybeError.message ?? fallback;
  }
}
