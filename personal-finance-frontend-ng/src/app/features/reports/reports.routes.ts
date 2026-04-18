import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';

import { ReportsPageComponent } from './reports-page.component';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    component: ReportsPageComponent,
    canActivate: [authGuard],
  },
];
