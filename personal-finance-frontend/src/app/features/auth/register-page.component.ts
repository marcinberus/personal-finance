import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthFacadeService } from '../../services/auth-facade.service';
import { toAppError } from '../../shared/api/http-error.util';

@Component({
  standalone: true,
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css'],
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authFacadeService = inject(AuthFacadeService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  protected submitting = false;
  protected errorMessage = '';

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
    this.errorMessage = '';

    const payload = {
      email: this.form.controls.email.value.trim(),
      password: this.form.controls.password.value,
    };

    this.authFacadeService
      .register(payload)
      .pipe(
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/dashboard']);
        },
        error: (err: unknown) => {
          this.errorMessage = toAppError(err, 'Registration failed. Please try again.').message;
        },
      });
  }
}
