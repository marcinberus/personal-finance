import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthSessionPayload = {
  accessToken: string;
  user: AuthUser;
};

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
};

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly stateSubject = new BehaviorSubject<AuthState>({
    status: 'unknown',
    user: null,
  });

  private accessToken: string | null = null;

  readonly state$: Observable<AuthState> = this.stateSubject.asObservable();

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getUser(): AuthUser | null {
    return this.stateSubject.value.user;
  }

  isAuthenticated(): boolean {
    return this.stateSubject.value.status === 'authenticated';
  }

  isBootstrapped(): boolean {
    return this.stateSubject.value.status !== 'unknown';
  }

  setAuthenticated(session: AuthSessionPayload): void {
    this.accessToken = session.accessToken;
    this.stateSubject.next({
      status: 'authenticated',
      user: session.user,
    });
  }

  setAnonymous(): void {
    this.accessToken = null;
    this.stateSubject.next({
      status: 'anonymous',
      user: null,
    });
  }
}
