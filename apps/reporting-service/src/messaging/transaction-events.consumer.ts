import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TRANSACTION_CREATED, TRANSACTION_DELETED } from '@app/contracts';
import type {
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@app/contracts';
import { ReportingProjectionService } from '../reporting/reporting-projection.service';

@Controller()
export class TransactionEventsConsumer {
  constructor(private readonly projection: ReportingProjectionService) {}

  @EventPattern(TRANSACTION_CREATED)
  async handleTransactionCreated(
    @Payload() event: TransactionCreatedEvent,
  ): Promise<void> {
    await this.projection.applyTransactionCreated(event.payload);
  }

  @EventPattern(TRANSACTION_DELETED)
  async handleTransactionDeleted(
    @Payload() event: TransactionDeletedEvent,
  ): Promise<void> {
    await this.projection.applyTransactionDeleted(event.payload);
  }
}
