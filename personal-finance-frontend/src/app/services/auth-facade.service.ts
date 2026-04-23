import { inject, Injectable } from '@angular/core';
import { Observable, of, shareReplay, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { AuthApiService, AuthCredentials } from './auth-api.service';
import { AuthSessionPayload, AuthStateService } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  private readonly authApiService = inject(AuthApiService);
  private readonly authStateService = inject(AuthStateService);

  private bootstrapRequest$: Observable<boolean> | null = null;
  private refreshRequest$: Observable<string> | null = null;

  login(credentials: AuthCredentials): Observable<AuthSessionPayload> {
    return this.authApiService
      .login(credentials)
      .pipe(tap((session) => this.authStateService.setAuthenticated(session)));
  }

  register(payload: AuthCredentials): Observable<AuthSessionPayload> {
    return this.authApiService
      .register(payload)
      .pipe(tap((session) => this.authStateService.setAuthenticated(session)));
  }

  initializeSession(): Observable<boolean> {
    if (this.authStateService.isBootstrapped()) {
      return of(this.authStateService.isAuthenticated());
    }

    if (this.bootstrapRequest$) {
      return this.bootstrapRequest$;
    }

    this.bootstrapRequest$ = this.authApiService.session().pipe(
      tap((session) => this.authStateService.setAuthenticated(session)),
      map(() => true),
      catchError(() => {
        this.authStateService.setAnonymous();
        return of(false);
      }),
      finalize(() => {
        this.bootstrapRequest$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    return this.bootstrapRequest$;
  }

  logout(): Observable<void> {
    return this.authApiService.logout().pipe(
      catchError(() => of(undefined)),
      tap(() => this.authStateService.setAnonymous()),
      map(() => undefined),
    );
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    this.refreshRequest$ = this.authApiService.refresh().pipe(
      tap((session) => this.authStateService.setAuthenticated(session)),
      map((session) => session.accessToken),
      catchError((error: unknown) => {
        this.authStateService.setAnonymous();
        return throwError(() => error);
      }),
      finalize(() => {
        this.refreshRequest$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    return this.refreshRequest$;
  }
}
