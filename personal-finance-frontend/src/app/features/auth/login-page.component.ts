import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthFacadeService } from '../../services/auth-facade.service';
import { toAppError } from '../../shared/api/http-error.util';

@Component({
  standalone: true,
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {
  private readonly authFacadeService = inject(AuthFacadeService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');

  protected model = {
    email: '',
    password: '',
  };

  protected submit(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const payload = {
      email: this.model.email.trim(),
      password: this.model.password,
    };

    this.authFacadeService
      .login(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/dashboard']);
        },
        error: (err: unknown) => {
          this.errorMessage.set(toAppError(err, 'Login failed. Please try again.').message);
        },
      });
  }
}
