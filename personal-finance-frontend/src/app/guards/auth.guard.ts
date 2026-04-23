import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthFacadeService } from '../services/auth-facade.service';
import { AuthStateService } from '../services/auth-state.service';

export const authGuard: CanActivateFn = () => {
  const authFacadeService = inject(AuthFacadeService);
  const authStateService = inject(AuthStateService);
  const router = inject(Router);

  if (authStateService.isBootstrapped()) {
    return authStateService.isAuthenticated() ? true : router.parseUrl('/login');
  }

  return authFacadeService
    .initializeSession()
    .pipe(map((isAuthenticated) => (isAuthenticated ? true : router.parseUrl('/login'))));
};
