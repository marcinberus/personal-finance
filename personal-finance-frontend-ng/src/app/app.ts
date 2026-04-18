import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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

  protected readonly eyebrow = this.shellConfig.topbar?.eyebrow ?? 'Distributed Finance';
  protected readonly title = this.shellConfig.topbar?.title ?? 'Personal Finance';
  protected readonly note = this.shellConfig.topbar?.note ?? 'Migration shell';

  protected get navTabs(): ShellTab[] {
    const authenticated = this.isAuthenticated();
    return (this.shellConfig.tabs ?? []).filter((tab) => tab.authOnly === authenticated);
  }

  protected get userEmail(): string {
    const raw = window.localStorage.getItem('pf_user');
    if (!raw) {
      return '';
    }

    try {
      const parsed = JSON.parse(raw) as { email?: string };
      return parsed.email ?? '';
    } catch {
      return '';
    }
  }

  protected isAuthenticated(): boolean {
    const token = window.localStorage.getItem('pf_access_token');
    return !!token && !!this.userEmail;
  }

  protected logout(): void {
    window.localStorage.removeItem('pf_access_token');
    window.localStorage.removeItem('pf_user');
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
