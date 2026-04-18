import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../shared/api/api-endpoints';
import { environment } from '../../environments/environment';

export type AuthUser = {
  id: string;
  email: string;
};

type AuthSessionPayload = {
  accessToken: string;
  user: AuthUser;
};

type AuthCredentials = {
  email: string;
  password: string;
};

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly http = inject(HttpClient);

  private readonly tokenKey = environment.storageKeys.authToken;
  private readonly userKey = environment.storageKeys.authUser;
  private readonly identityBaseUrl = API_ENDPOINTS.identityBaseUrl;

  login(credentials: AuthCredentials): Observable<AuthSessionPayload> {
    return this.http
      .post<AuthSessionPayload>(`${this.identityBaseUrl}/auth/login`, credentials)
      .pipe(tap((payload) => this.saveSession(payload)));
  }

  register(payload: AuthCredentials): Observable<AuthSessionPayload> {
    return this.http
      .post<AuthSessionPayload>(`${this.identityBaseUrl}/auth/register`, payload)
      .pipe(tap((session) => this.saveSession(session)));
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.identityBaseUrl}/auth/me`);
  }

  getToken(): string | null {
    return window.localStorage.getItem(this.tokenKey);
  }

  getUser(): AuthUser | null {
    const value = window.localStorage.getItem(this.userKey);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      window.localStorage.removeItem(this.userKey);
      return null;
    }
  }

  isAuthenticated(): boolean {
    const hasToken = !!window.localStorage.getItem(this.tokenKey);
    const hasUser = !!this.getUser();

    if (hasToken && !hasUser) {
      this.clearSession();
    }

    return hasToken && hasUser;
  }

  logout(): void {
    this.clearSession();
  }

  private saveSession(payload: AuthSessionPayload): void {
    window.localStorage.setItem(this.tokenKey, payload.accessToken);
    window.localStorage.setItem(this.userKey, JSON.stringify(payload.user));
  }

  private clearSession(): void {
    window.localStorage.removeItem(this.tokenKey);
    window.localStorage.removeItem(this.userKey);
  }
}
