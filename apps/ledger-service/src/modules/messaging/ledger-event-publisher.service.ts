import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';
import {
  CATEGORY_CREATED,
  TRANSACTION_CREATED,
  TRANSACTION_DELETED,
} from '@app/contracts';
import type {
  CategoryCreatedPayload,
  TransactionCreatedPayload,
  TransactionDeletedPayload,
} from '@app/contracts';
import { LEDGER_RMQ_CLIENT } from './messaging.constants';

@Injectable()
export class LedgerEventPublisher {
  constructor(
    @Inject(LEDGER_RMQ_CLIENT) private readonly client: ClientProxy,
  ) {}

  async publishTransactionCreated(
    payload: TransactionCreatedPayload,
    correlationId?: string,
  ): Promise<void> {
    await lastValueFrom(
      this.client.emit(TRANSACTION_CREATED, {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        correlationId,
        payload,
      }),
    );
  }

  async publishTransactionDeleted(
    payload: TransactionDeletedPayload,
    correlationId?: string,
  ): Promise<void> {
    await lastValueFrom(
      this.client.emit(TRANSACTION_DELETED, {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        correlationId,
        payload,
      }),
    );
  }

  async publishCategoryCreated(
    payload: CategoryCreatedPayload,
    correlationId?: string,
  ): Promise<void> {
    await lastValueFrom(
      this.client.emit(CATEGORY_CREATED, {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        correlationId,
        payload,
      }),
    );
  }
}
