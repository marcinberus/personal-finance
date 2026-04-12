import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_REQUEST_TIMEOUT = 408;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

export interface RemoteUserInfo {
  id: string;
  email: string;
}

@Injectable()
export class IdentityClientService {
  private readonly logger = new Logger(IdentityClientService.name);
  private readonly baseUrl: string;
  private readonly secret: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(private readonly config: ConfigService) {
    const baseUrl = this.config.get<string>('IDENTITY_SERVICE_URL');
    const secret = this.config.get<string>('INTERNAL_SECRET');
    const timeoutMs = Number(
      this.config.get<string>('IDENTITY_HTTP_TIMEOUT_MS') ?? '1500',
    );
    const maxRetries = Number(
      this.config.get<string>('IDENTITY_HTTP_RETRIES') ?? '1',
    );

    if (!baseUrl) throw new Error('IDENTITY_SERVICE_URL is not configured');
    if (!secret) throw new Error('INTERNAL_SECRET is not configured');
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new Error('IDENTITY_HTTP_TIMEOUT_MS must be a positive number');
    }
    if (!Number.isInteger(maxRetries) || maxRetries < 0) {
      throw new Error('IDENTITY_HTTP_RETRIES must be a non-negative integer');
    }

    this.baseUrl = baseUrl;
    this.secret = secret;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
  }

  async getUserById(id: string): Promise<RemoteUserInfo> {
    const url = `${this.baseUrl}/api/internal/users/${encodeURIComponent(id)}`;
    this.logger.debug(`Fetching user from identity-service: ${url}`);

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.fetchWithTimeout(url);

        if (response.status === HTTP_STATUS_NOT_FOUND) {
          throw new NotFoundException(
            `User ${id} not found in identity service`,
          );
        }

        if (response.ok) {
          return response.json() as Promise<RemoteUserInfo>;
        }

        if (
          this.isRetryableStatus(response.status) &&
          attempt < this.maxRetries
        ) {
          this.logger.warn(
            `Identity request failed with ${response.status}; retrying (${attempt + 1}/${this.maxRetries})`,
          );
          continue;
        }

        if (this.isRetryableStatus(response.status)) {
          throw new ServiceUnavailableException(
            'Identity service is unavailable',
          );
        }

        throw new InternalServerErrorException(
          `Identity service request failed with status ${response.status}`,
        );
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        if (this.isRetryableError(error) && attempt < this.maxRetries) {
          this.logger.warn(
            `Identity request failed (${this.describeError(error)}); retrying (${attempt + 1}/${this.maxRetries})`,
          );
          continue;
        }

        if (this.isRetryableError(error)) {
          this.logger.error(
            `Identity service unavailable after ${this.maxRetries + 1} attempt(s): ${this.describeError(error)}`,
          );
          throw new ServiceUnavailableException(
            'Identity service is unavailable',
          );
        }

        throw error;
      }
    }

    throw new ServiceUnavailableException('Identity service is unavailable');
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(url, {
        headers: { 'x-internal-secret': this.secret },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private isRetryableStatus(status: number): boolean {
    return (
      status >= HTTP_STATUS_INTERNAL_SERVER_ERROR ||
      status === HTTP_STATUS_REQUEST_TIMEOUT ||
      status === HTTP_STATUS_TOO_MANY_REQUESTS
    );
  }

  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return (
      error.name === 'AbortError' ||
      error.name === 'TypeError' ||
      error.message.includes('fetch failed')
    );
  }

  private describeError(error: unknown): string {
    return error instanceof Error
      ? `${error.name}: ${error.message}`
      : 'unknown error';
  }
}
