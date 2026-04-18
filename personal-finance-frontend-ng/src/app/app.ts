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
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly shellConfig: ShellConfig = window.PF_SHELL_CONFIG ?? {};

  protected readonly eyebrow = this.shellConfig.topbar?.eyebrow ?? 'Distributed Finance';
  protected readonly title = this.shellConfig.topbar?.title ?? 'Personal Finance';
  protected readonly note = this.shellConfig.topbar?.note ?? 'Migration shell';
  protected readonly navTabs = (this.shellConfig.tabs ?? []).filter((tab) => tab.authOnly);

  protected isActiveTab(path: string | null, owner: 'legacy' | 'ng'): boolean {
    if (owner !== 'ng') {
      return false;
    }

    if (!path) {
      return false;
    }

    const currentPath = window.location.pathname || '/';
    return currentPath === path;
  }
}
