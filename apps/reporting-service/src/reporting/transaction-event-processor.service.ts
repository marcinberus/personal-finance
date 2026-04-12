import { Injectable, Logger } from '@nestjs/common';
import {
  TRANSACTION_CREATED,
  TRANSACTION_DELETED,
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@app/contracts';
import {
  ProjectionDbClient,
  ReportingProjectionService,
} from './reporting-projection.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionEventProcessorService {
  private readonly logger = new Logger(TransactionEventProcessorService.name);

  constructor(
    private readonly projection: ReportingProjectionService,
    private readonly prisma: PrismaService,
  ) {}

  async handleTransactionCreated(
    event: TransactionCreatedEvent,
  ): Promise<void> {
    this.assertEventEnvelope(TRANSACTION_CREATED, event);

    await this.processOnce(TRANSACTION_CREATED, event, async (tx) =>
      this.projection.applyTransactionCreated(event.payload, tx),
    );
  }

  async handleTransactionDeleted(
    event: TransactionDeletedEvent,
  ): Promise<void> {
    this.assertEventEnvelope(TRANSACTION_DELETED, event);

    await this.processOnce(TRANSACTION_DELETED, event, async (tx) =>
      this.projection.applyTransactionDeleted(event.payload, tx),
    );
  }

  private async processOnce(
    eventName: string,
    event: TransactionCreatedEvent | TransactionDeletedEvent,
    applyProjection: (tx: ProjectionDbClient) => Promise<void>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const insertedRows = await tx.$executeRaw`
        INSERT INTO "ProjectionInboxEvent" ("eventId", "eventName", "occurredAt", "correlationId")
        VALUES (${event.eventId}, ${eventName}, ${new Date(event.occurredAt)}, ${event.correlationId ?? null})
        ON CONFLICT ("eventId", "eventName") DO NOTHING
      `;

      if (insertedRows === 0) {
        this.logger.debug(
          JSON.stringify({
            message: 'event.duplicate.ignored',
            eventName,
            eventId: event.eventId,
            correlationId: event.correlationId,
          }),
        );
        return;
      }

      await applyProjection(tx);
    });
  }

  private assertEventEnvelope(
    eventName: string,
    event: TransactionCreatedEvent | TransactionDeletedEvent,
  ): void {
    if (!event?.eventId || !event?.occurredAt || !event?.payload) {
      this.logger.error(
        JSON.stringify({
          message: 'event.envelope.invalid',
          eventName,
          eventId: event?.eventId,
          correlationId: event?.correlationId,
        }),
      );
      throw new Error(`Invalid ${eventName} event envelope`);
    }
  }
}
