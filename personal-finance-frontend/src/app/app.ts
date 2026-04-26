import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthFacadeService } from './services/auth-facade.service';
import { AuthStateService } from './services/auth-state.service';

type Tab = {
  id: string;
  label: string;
  route: string;
  authOnly: boolean;
};

const TABS: Tab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    authOnly: true,
  },
  {
    id: 'categories',
    label: 'Categories',
    route: '/categories',
    authOnly: true,
  },
  {
    id: 'transactions',
    label: 'Transactions',
    route: '/transactions',
    authOnly: true,
  },
  {
    id: 'reports',
    label: 'Reports',
    route: '/reports',
    authOnly: true,
  },
  {
    id: 'login',
    label: 'Login',
    route: '/login',
    authOnly: false,
  },
  {
    id: 'register',
    label: 'Register',
    route: '/register',
    authOnly: false,
  },
];

@Component({
  standalone: true,
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authFacadeService = inject(AuthFacadeService);
  private readonly authStateService = inject(AuthStateService);
  private readonly router = inject(Router);

  protected readonly eyebrow = 'Distributed Finance';
  protected readonly title = 'Personal Finance';

  protected readonly vm = computed(() => {
    const state = this.authStateService.state();
    const isAuthenticated = state.status === 'authenticated';
    return {
      isAuthenticated,
      userEmail: state.user?.email ?? '',
      navTabs: TABS.filter((tab) => tab.authOnly === isAuthenticated),
    };
  });

  protected logout(): void {
    this.authFacadeService.logout().subscribe({
      next: () => {
        void this.router.navigate(['/login']);
      },
    });
  }
}
