import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthFacadeService } from './services/auth-facade.service';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideAppInitializer(() => {
      const authFacadeService = inject(AuthFacadeService);
      return firstValueFrom(authFacadeService.initializeSession());
    }),
  ],
};
