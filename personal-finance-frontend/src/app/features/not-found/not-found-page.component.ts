import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthFacadeService } from '../../services/auth-facade.service';

@Component({
  standalone: true,
  selector: 'app-not-found-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="panel not-found-shell">
      <p class="eyebrow">404</p>
      <h2>Page Not Found</h2>
      <p class="muted">This route does not exist.</p>
      <div class="actions">
        <a class="btn primary" routerLink="/dashboard">Go To Dashboard</a>
        <button class="btn ghost" type="button" (click)="logout()">Logout</button>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .not-found-shell {
        max-width: 640px;
        margin: 2rem auto;
      }

      .actions {
        margin-top: 1rem;
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }

      .actions a {
        text-decoration: none;
      }
    `,
  ],
})
export class NotFoundPageComponent {
  private readonly authFacadeService = inject(AuthFacadeService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.authFacadeService.logout().subscribe({
      next: () => {
        void this.router.navigate(['/login']);
      },
    });
  }
}
