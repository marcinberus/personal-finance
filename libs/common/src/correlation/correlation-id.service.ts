import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

const CORRELATION_ID_STORE_KEY = 'correlationId';
const MAX_CORRELATION_ID_LENGTH = 128;

@Injectable()
export class CorrelationIdService {
  private readonly storage = new AsyncLocalStorage<Map<string, string>>();

  runWithCorrelationId<T>(
    correlationId: string | undefined,
    callback: () => T,
  ): T {
    const store = new Map<string, string>();
    store.set(
      CORRELATION_ID_STORE_KEY,
      this.normalizeCorrelationId(correlationId) ?? randomUUID(),
    );

    return this.storage.run(store, callback);
  }

  getCorrelationId(): string | undefined {
    return this.storage.getStore()?.get(CORRELATION_ID_STORE_KEY);
  }

  private normalizeCorrelationId(
    correlationId: string | undefined,
  ): string | undefined {
    if (!correlationId) {
      return undefined;
    }

    const normalized = correlationId.trim();

    if (!normalized) {
      return undefined;
    }

    return normalized.substring(0, MAX_CORRELATION_ID_LENGTH);
  }
}
