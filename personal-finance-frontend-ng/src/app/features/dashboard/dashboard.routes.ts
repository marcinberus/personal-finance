import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';

import { DashboardPageComponent } from './dashboard-page.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardPageComponent,
    canActivate: [authGuard],
  },
];
