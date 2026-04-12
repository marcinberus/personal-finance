import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { TransactionSummaryService } from './transaction-summary.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [IdentityModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionSummaryService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
