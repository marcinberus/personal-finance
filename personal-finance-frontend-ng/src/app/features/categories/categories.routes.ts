import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';

import { CategoriesPageComponent } from './categories-page.component';

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    component: CategoriesPageComponent,
    canActivate: [authGuard],
  },
];
