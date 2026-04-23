import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthFacadeService } from '../services/auth-facade.service';
import { AuthStateService } from '../services/auth-state.service';

export const AUTH_REFRESH_RETRIED = new HttpContextToken<boolean>(() => false);

const AUTH_ROUTE_SEGMENT = '/auth/';

function isAuthEndpoint(url: string): boolean {
  if (!url.includes(AUTH_ROUTE_SEGMENT)) {
    return false;
  }

  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/session') ||
    url.includes('/auth/logout')
  );
}

function attachBearerToken(
  req: Parameters<HttpInterceptorFn>[0],
  token: string | null,
): Parameters<HttpInterceptorFn>[0] {
  if (!token) {
    return req;
  }

  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStateService = inject(AuthStateService);
  const authFacadeService = inject(AuthFacadeService);
  const request = attachBearerToken(req, authStateService.getAccessToken());

  return next(request).pipe(
    catchError((error: unknown) => {
      const shouldRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthEndpoint(request.url) &&
        !request.context.get(AUTH_REFRESH_RETRIED);

      if (!shouldRefresh) {
        return throwError(() => error);
      }

      return authFacadeService.refreshAccessToken().pipe(
        switchMap((token) => {
          const retriedRequest = attachBearerToken(request, token).clone({
            context: request.context.set(AUTH_REFRESH_RETRIED, true),
          });
          return next(retriedRequest);
        }),
      );
    }),
  );
};
