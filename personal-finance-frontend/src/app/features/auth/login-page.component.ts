import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthSessionService } from '../../services/auth-session.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {
  private readonly authSessionService = inject(AuthSessionService);

  protected submitting = false;

  protected model = {
    email: '',
    password: '',
  };

  protected submit(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    this.submitting = true;

    const payload = {
      email: this.model.email.trim(),
      password: this.model.password,
    };

    this.authSessionService
      .login(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          window.location.assign('/dashboard');
        },
      });
  }
}
