import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';

import { TransactionsPageComponent } from './transactions-page.component';

export const TRANSACTIONS_ROUTES: Routes = [
  {
    path: '',
    component: TransactionsPageComponent,
    canActivate: [authGuard],
  },
];
