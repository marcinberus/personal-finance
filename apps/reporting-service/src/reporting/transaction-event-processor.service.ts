import { Injectable, Logger } from '@nestjs/common';
import {
  TRANSACTION_CREATED,
  TRANSACTION_DELETED,
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@app/contracts';
import {
  ProjectionEventContext,
  ReportingProjectionService,
} from './reporting-projection.service';

function buildContext(
  eventName: string,
  event: TransactionCreatedEvent | TransactionDeletedEvent,
): ProjectionEventContext {
  return {
    eventName,
    eventId: event.eventId,
    occurredAt: event.occurredAt,
    correlationId: event.correlationId,
  };
}

@Injectable()
export class TransactionEventProcessorService {
  private readonly logger = new Logger(TransactionEventProcessorService.name);

  constructor(private readonly projection: ReportingProjectionService) {}

  async handleTransactionCreated(
    event: TransactionCreatedEvent,
  ): Promise<void> {
    this.assertEventEnvelope(TRANSACTION_CREATED, event);

    await this.projection.applyTransactionCreated(
      event.payload,
      buildContext(TRANSACTION_CREATED, event),
    );
  }

  async handleTransactionDeleted(
    event: TransactionDeletedEvent,
  ): Promise<void> {
    this.assertEventEnvelope(TRANSACTION_DELETED, event);

    await this.projection.applyTransactionDeleted(
      event.payload,
      buildContext(TRANSACTION_DELETED, event),
    );
  }

  private assertEventEnvelope(
    eventName: string,
    event: TransactionCreatedEvent | TransactionDeletedEvent,
  ): void {
    if (!event?.eventId || !event?.occurredAt || !event?.payload) {
      this.logger.error(`Invalid ${eventName} event envelope received`);
      throw new Error(`Invalid ${eventName} event envelope`);
    }
  }
}
