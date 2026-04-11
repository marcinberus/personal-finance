import { Module } from '@nestjs/common';
import { TransactionEventsConsumer } from './transaction-events.consumer';
import { ReportingModule } from '../reporting/reporting.module';

@Module({
  imports: [ReportingModule],
  controllers: [TransactionEventsConsumer],
})
export class MessagingModule {}
