import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthSessionService } from './services/auth-session.service';

type ShellTab = {
  id: string;
  label: string;
  href: string;
  path: string | null;
  owner: 'legacy' | 'ng';
  authOnly: boolean;
};

type ShellConfig = {
  topbar?: {
    eyebrow?: string;
    title?: string;
    note?: string;
  };
  tabs?: ShellTab[];
};

declare global {
  interface Window {
    PF_SHELL_CONFIG?: ShellConfig;
  }
}

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly shellConfig: ShellConfig = window.PF_SHELL_CONFIG ?? {};
  private readonly authSessionService = inject(AuthSessionService);

  protected readonly eyebrow = this.shellConfig.topbar?.eyebrow ?? 'Distributed Finance';
  protected readonly title = this.shellConfig.topbar?.title ?? 'Personal Finance';
  protected readonly note = this.shellConfig.topbar?.note ?? 'Migration shell';

  protected get navTabs(): ShellTab[] {
    const authenticated = this.isAuthenticated();
    return (this.shellConfig.tabs ?? []).filter((tab) => tab.authOnly === authenticated);
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

  protected isActiveTab(path: string | null, owner: 'legacy' | 'ng'): boolean {
    if (!path) {
      return false;
    }

    if (owner === 'legacy') {
      const currentHashPath = (window.location.hash || '').replace(/^#/, '') || '/';
      return currentHashPath === path;
    }

    const currentPath = window.location.pathname || '/';
    return currentPath === path;
  }
}
