import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthSessionService } from './services/auth-session.service';

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
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authSessionService = inject(AuthSessionService);

  protected readonly eyebrow = 'Distributed Finance';
  protected readonly title = 'Personal Finance';

  protected get navTabs(): Tab[] {
    const authenticated = this.isAuthenticated();
    return TABS.filter((tab) => tab.authOnly === authenticated);
  }

  protected get userEmail(): string {
    return this.authSessionService.getUser()?.email ?? '';
  }

  protected isAuthenticated(): boolean {
    return this.authSessionService.isAuthenticated();
  }

  protected logout(): void {
    this.authSessionService.logout();
    window.location.assign('/login');
  }
}
