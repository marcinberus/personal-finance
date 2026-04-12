import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CorrelationIdModule, JwtAuthModule } from '@app/common';
import { PrismaModule } from './prisma/prisma.module';
import { ReportingModule } from './reporting/reporting.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CorrelationIdModule,
    PrismaModule,
    JwtAuthModule.register(),
    ReportingModule,
    MessagingModule,
  ],
})
export class AppModule {}
