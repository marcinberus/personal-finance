import { Module } from '@nestjs/common';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { ReportingProjectionService } from './reporting-projection.service';
import { TransactionEventProcessorService } from './transaction-event-processor.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportingController],
  providers: [
    ReportingService,
    ReportingProjectionService,
    TransactionEventProcessorService,
  ],
  exports: [ReportingProjectionService, TransactionEventProcessorService],
})
export class ReportingModule {}
