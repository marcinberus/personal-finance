import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TRANSACTION_CREATED, TRANSACTION_DELETED } from '@app/contracts';
import { CorrelationIdService } from '@app/common';
import type {
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@app/contracts';
import { TransactionEventProcessorService } from '../reporting/transaction-event-processor.service';

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
  ): Promise<void> {
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
  }

  @EventPattern(TRANSACTION_DELETED)
  async handleTransactionDeleted(
    @Payload() event: TransactionDeletedEvent,
  ): Promise<void> {
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
  }
}
