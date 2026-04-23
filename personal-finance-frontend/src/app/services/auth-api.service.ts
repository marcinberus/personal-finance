import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../shared/api/api-endpoints';
import { AuthSessionPayload } from './auth-state.service';

export type AuthCredentials = {
  email: string;
  password: string;
};

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly identityBaseUrl = API_ENDPOINTS.identityBaseUrl;

  login(credentials: AuthCredentials): Observable<AuthSessionPayload> {
    return this.http.post<AuthSessionPayload>(`${this.identityBaseUrl}/auth/login`, credentials, {
      withCredentials: true,
    });
  }

  register(payload: AuthCredentials): Observable<AuthSessionPayload> {
    return this.http.post<AuthSessionPayload>(`${this.identityBaseUrl}/auth/register`, payload, {
      withCredentials: true,
    });
  }

  refresh(): Observable<AuthSessionPayload> {
    return this.http.post<AuthSessionPayload>(
      `${this.identityBaseUrl}/auth/refresh`,
      {},
      { withCredentials: true },
    );
  }

  session(): Observable<AuthSessionPayload> {
    return this.http.get<AuthSessionPayload>(`${this.identityBaseUrl}/auth/session`, {
      withCredentials: true,
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.identityBaseUrl}/auth/logout`,
      {},
      {
        withCredentials: true,
      },
    );
  }
}
