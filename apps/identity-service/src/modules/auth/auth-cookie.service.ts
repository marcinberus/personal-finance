import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

const DEFAULT_REFRESH_COOKIE_NAME = 'pf_refresh_token';
const DEFAULT_COOKIE_PATH = '/api/auth';
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 604800;
const DEFAULT_COOKIE_SAME_SITE = 'lax';

@Injectable()
export class AuthCookieService {
  readonly cookieName: string;
  readonly refreshTokenTtlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.cookieName =
      this.configService.get<string>('AUTH_REFRESH_COOKIE_NAME') ??
      DEFAULT_REFRESH_COOKIE_NAME;

    const ttlSeconds = Number(
      this.configService.get<string>('AUTH_REFRESH_TOKEN_TTL_SECONDS') ??
        DEFAULT_REFRESH_TOKEN_TTL_SECONDS,
    );

    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error(
        'AUTH_REFRESH_TOKEN_TTL_SECONDS must be a positive number',
      );
    }

    this.refreshTokenTtlSeconds = ttlSeconds;
  }

  getSetCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.resolveSecureFlag(),
      sameSite: this.resolveSameSite(),
      path: this.resolveCookiePath(),
      maxAge: this.refreshTokenTtlSeconds * 1000,
    };
  }

  getClearCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.resolveSecureFlag(),
      sameSite: this.resolveSameSite(),
      path: this.resolveCookiePath(),
    };
  }

  private resolveSecureFlag(): boolean {
    return this.configService.get<string>('AUTH_COOKIE_SECURE') === 'true';
  }

  private resolveCookiePath(): string {
    return (
      this.configService.get<string>('AUTH_REFRESH_COOKIE_PATH') ??
      DEFAULT_COOKIE_PATH
    );
  }

  private resolveSameSite(): CookieOptions['sameSite'] {
    const configured =
      this.configService.get<string>('AUTH_COOKIE_SAME_SITE') ??
      DEFAULT_COOKIE_SAME_SITE;

    const normalized = configured.toLowerCase();

    if (
      normalized === 'lax' ||
      normalized === 'strict' ||
      normalized === 'none'
    ) {
      return normalized;
    }

    throw new Error('AUTH_COOKIE_SAME_SITE must be lax, strict, or none');
  }
}
