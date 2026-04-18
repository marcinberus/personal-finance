import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected submitting = false;

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const email = this.form.controls.email.value.trim();
    const migrationUser = {
      id: 'migration-user',
      email,
    };

    // Keep the same storage contract used by legacy AuthSessionService.
    window.localStorage.setItem('pf_access_token', 'migration-mode-token');
    window.localStorage.setItem('pf_user', JSON.stringify(migrationUser));
    window.location.assign('/dashboard');
  }
}
