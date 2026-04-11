import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { OutboxPublisherWorker } from '../../../../src/modules/messaging/outbox-publisher.worker';
import { LEDGER_RMQ_CLIENT } from '../../../../src/modules/messaging/messaging.constants';
import {
  TRANSACTION_CREATED,
  TRANSACTION_DELETED,
  type EventEnvelope,
} from '@app/contracts';
import { cleanDatabase } from '../database';

describe('OutboxPublisherWorker (integration)', () => {
  let moduleRef: TestingModule;
  let worker: OutboxPublisherWorker;
  let prisma: PrismaService;

  const mockClient = {
    emit: jest.fn(),
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
      ],
      providers: [
        OutboxPublisherWorker,
        { provide: LEDGER_RMQ_CLIENT, useValue: mockClient },
      ],
    }).compile();

    worker = moduleRef.get(OutboxPublisherWorker);
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    jest.clearAllMocks();
  });

  it('publishes pending messages and marks them as processed', async () => {
    const createdEnvelope: EventEnvelope & {
      payload: { transactionId: string; amount: string };
    } = {
      eventId: 'event-1',
      occurredAt: new Date().toISOString(),
      payload: {
        transactionId: 'tx-1',
        amount: '100.00',
      },
    };

    const deletedEnvelope: EventEnvelope & {
      payload: { transactionId: string; amount: string };
    } = {
      eventId: 'event-2',
      occurredAt: new Date().toISOString(),
      payload: {
        transactionId: 'tx-2',
        amount: '50.00',
      },
    };

    const first = await prisma.outboxMessage.create({
      data: {
        eventType: TRANSACTION_CREATED,
        payload: createdEnvelope,
      },
    });

    const second = await prisma.outboxMessage.create({
      data: {
        eventType: TRANSACTION_DELETED,
        payload: deletedEnvelope,
      },
    });

    mockClient.emit.mockReturnValue(of(undefined));

    await worker.processPendingMessages();

    expect(mockClient.emit).toHaveBeenCalledTimes(2);
    expect(mockClient.emit).toHaveBeenNthCalledWith(
      1,
      TRANSACTION_CREATED,
      expect.objectContaining({ eventId: 'event-1' }),
    );
    expect(mockClient.emit).toHaveBeenNthCalledWith(
      2,
      TRANSACTION_DELETED,
      expect.objectContaining({ eventId: 'event-2' }),
    );

    const storedFirst = await prisma.outboxMessage.findUnique({
      where: { id: first.id },
    });
    const storedSecond = await prisma.outboxMessage.findUnique({
      where: { id: second.id },
    });

    expect(storedFirst?.processedAt).toBeInstanceOf(Date);
    expect(storedSecond?.processedAt).toBeInstanceOf(Date);
  });

  it('keeps message unpublished when emit fails', async () => {
    const failedEnvelope: EventEnvelope & {
      payload: { transactionId: string };
    } = {
      eventId: 'event-fail',
      occurredAt: new Date().toISOString(),
      payload: { transactionId: 'tx-fail' },
    };

    const message = await prisma.outboxMessage.create({
      data: {
        eventType: TRANSACTION_CREATED,
        payload: failedEnvelope,
      },
    });

    mockClient.emit.mockReturnValue(
      throwError(() => new Error('rabbitmq unavailable')),
    );

    await worker.processPendingMessages();

    const stored = await prisma.outboxMessage.findUnique({
      where: { id: message.id },
    });

    expect(mockClient.emit).toHaveBeenCalledTimes(1);
    expect(stored?.processedAt).toBeNull();
  });
});
