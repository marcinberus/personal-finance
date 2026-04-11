import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LedgerEventPublisher } from './ledger-event-publisher.service';
import { LEDGER_EVENTS_QUEUE, LEDGER_RMQ_CLIENT } from './messaging.constants';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: LEDGER_RMQ_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('RABBITMQ_URL')],
            queue: LEDGER_EVENTS_QUEUE,
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  providers: [LedgerEventPublisher],
  exports: [LedgerEventPublisher],
})
export class MessagingModule {}
