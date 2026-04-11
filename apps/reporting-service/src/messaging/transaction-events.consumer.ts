import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TRANSACTION_CREATED, TRANSACTION_DELETED } from '@app/contracts';
import type {
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@app/contracts';
import { TransactionEventProcessorService } from '../reporting/transaction-event-processor.service';

@Controller()
export class TransactionEventsConsumer {
  constructor(private readonly processor: TransactionEventProcessorService) {}

  @EventPattern(TRANSACTION_CREATED)
  async handleTransactionCreated(
    @Payload() event: TransactionCreatedEvent,
  ): Promise<void> {
    await this.processor.handleTransactionCreated(event);
  }

  @EventPattern(TRANSACTION_DELETED)
  async handleTransactionDeleted(
    @Payload() event: TransactionDeletedEvent,
  ): Promise<void> {
    await this.processor.handleTransactionDeleted(event);
  }
}
