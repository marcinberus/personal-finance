import { computed, Injectable, signal } from '@angular/core';

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
  private readonly _state = signal<AuthState>({
    status: 'unknown',
    user: null,
  });

  private accessToken: string | null = null;

  readonly state = this._state.asReadonly();
  readonly isAuthenticated = computed(() => this._state().status === 'authenticated');
  readonly isBootstrapped = computed(() => this._state().status !== 'unknown');

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getUser(): AuthUser | null {
    return this._state().user;
  }

  setAuthenticated(session: AuthSessionPayload): void {
    this.accessToken = session.accessToken;
    this._state.set({
      status: 'authenticated',
      user: session.user,
    });
  }

  setAnonymous(): void {
    this.accessToken = null;
    this._state.set({
      status: 'anonymous',
      user: null,
    });
  }
}
