import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { TRANSACTION_CREATED, TRANSACTION_DELETED } from '@app/contracts';
import { CorrelationIdService } from '@app/common';
import type {
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@app/contracts';
import { TransactionEventProcessorService } from '../reporting/transaction-event-processor.service';

type AcknowledgeableChannel = {
  ack(message: unknown): void;
  nack(message: unknown, allUpTo?: boolean, requeue?: boolean): void;
};

@Controller()
export class TransactionEventsConsumer {
  private readonly logger = new Logger(TransactionEventsConsumer.name);

  constructor(
    private readonly processor: TransactionEventProcessorService,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

  @EventPattern(TRANSACTION_CREATED)
  async handleTransactionCreated(
    @Payload() event: TransactionCreatedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as AcknowledgeableChannel;
    const originalMessage: unknown = context.getMessage();

    try {
      await this.correlationIdService.runWithCorrelationId(
        event.correlationId,
        async () => {
          this.logger.log(
            JSON.stringify({
              message: 'event.received',
              eventName: TRANSACTION_CREATED,
              eventId: event.eventId,
              correlationId: this.correlationIdService.getCorrelationId(),
            }),
          );

          await this.processor.handleTransactionCreated(event);
        },
      );

      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          message: 'event.processing.failed',
          eventName: TRANSACTION_CREATED,
          eventId: event.eventId,
          correlationId: event.correlationId,
        }),
        error instanceof Error ? error.stack : undefined,
      );

      channel.nack(originalMessage, false, true);
    }
  }

  @EventPattern(TRANSACTION_DELETED)
  async handleTransactionDeleted(
    @Payload() event: TransactionDeletedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as AcknowledgeableChannel;
    const originalMessage: unknown = context.getMessage();

    try {
      await this.correlationIdService.runWithCorrelationId(
        event.correlationId,
        async () => {
          this.logger.log(
            JSON.stringify({
              message: 'event.received',
              eventName: TRANSACTION_DELETED,
              eventId: event.eventId,
              correlationId: this.correlationIdService.getCorrelationId(),
            }),
          );

          await this.processor.handleTransactionDeleted(event);
        },
      );

      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          message: 'event.processing.failed',
          eventName: TRANSACTION_DELETED,
          eventId: event.eventId,
          correlationId: event.correlationId,
        }),
        error instanceof Error ? error.stack : undefined,
      );

      channel.nack(originalMessage, false, true);
    }
  }
}
