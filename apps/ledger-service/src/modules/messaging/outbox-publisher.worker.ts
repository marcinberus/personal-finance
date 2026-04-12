import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LEDGER_RMQ_CLIENT } from './messaging.constants';

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_BATCH_SIZE = 50;

@Injectable()
export class OutboxPublisherWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisherWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private pollIntervalMs = DEFAULT_POLL_INTERVAL_MS;
  private batchSize = DEFAULT_BATCH_SIZE;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(LEDGER_RMQ_CLIENT) private readonly client: ClientProxy,
  ) {}

  onModuleInit(): void {
    const isEnabled =
      this.configService.get<string>('OUTBOX_PUBLISHER_ENABLED') !== 'false';

    if (!isEnabled) {
      this.logger.log('Outbox publisher worker is disabled');
      return;
    }

    this.pollIntervalMs =
      Number(this.configService.get<string>('OUTBOX_POLL_INTERVAL_MS')) ||
      DEFAULT_POLL_INTERVAL_MS;
    this.batchSize =
      Number(this.configService.get<string>('OUTBOX_PUBLISH_BATCH_SIZE')) ||
      DEFAULT_BATCH_SIZE;

    this.timer = setInterval(() => {
      void this.processPendingMessages();
    }, this.pollIntervalMs);

    void this.processPendingMessages();

    this.logger.log(
      `Outbox publisher worker started (interval=${this.pollIntervalMs}ms, batchSize=${this.batchSize})`,
    );
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async processPendingMessages(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const pendingMessages = await this.prisma.outboxMessage.findMany({
        where: {
          processedAt: null,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: this.batchSize,
      });

      for (const message of pendingMessages) {
        try {
          await lastValueFrom(
            this.client.emit(message.eventType, message.payload as unknown),
          );

          await this.prisma.outboxMessage.updateMany({
            where: {
              id: message.id,
              processedAt: null,
            },
            data: {
              processedAt: new Date(),
            },
          });
        } catch (error) {
          this.logger.error(
            JSON.stringify({
              message: 'outbox.publish.failed',
              outboxMessageId: message.id,
              eventType: message.eventType,
              correlationId: this.extractCorrelationId(message.payload),
            }),
            error instanceof Error ? error.stack : undefined,
          );

          break;
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  private extractCorrelationId(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    const maybeCorrelationId = (payload as { correlationId?: unknown })
      .correlationId;

    return typeof maybeCorrelationId === 'string'
      ? maybeCorrelationId
      : undefined;
  }
}
