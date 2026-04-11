import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LEDGER_RMQ_CLIENT } from './messaging.constants';
import { OutboxPublisherWorker } from './outbox-publisher.worker';

const mockPrismaService = {
  outboxMessage: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockConfigService = {
  get: jest.fn(),
};

const mockClient = {
  emit: jest.fn(),
};

describe('OutboxPublisherWorker', () => {
  let worker: OutboxPublisherWorker;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxPublisherWorker,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LEDGER_RMQ_CLIENT, useValue: mockClient },
      ],
    }).compile();

    worker = module.get(OutboxPublisherWorker);

    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue(undefined);
  });

  it('publishes pending outbox messages and marks them as processed', async () => {
    mockPrismaService.outboxMessage.findMany.mockResolvedValue([
      {
        id: 'msg-1',
        eventType: 'transaction.created',
        payload: { eventId: 'e1', occurredAt: new Date().toISOString() },
      },
    ]);
    mockClient.emit.mockReturnValue(of(undefined));
    mockPrismaService.outboxMessage.updateMany.mockResolvedValue({ count: 1 });

    await worker.processPendingMessages();

    expect(mockPrismaService.outboxMessage.findMany).toHaveBeenCalledWith({
      where: { processedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    const firstEmitArgs = mockClient.emit.mock.calls[0] as unknown as [
      string,
      { eventId: string; occurredAt: string },
    ];
    expect(firstEmitArgs[0]).toBe('transaction.created');
    expect(firstEmitArgs[1].eventId).toBe('e1');
    expect(typeof firstEmitArgs[1].occurredAt).toBe('string');
    expect(mockPrismaService.outboxMessage.updateMany).toHaveBeenCalledTimes(1);
  });

  it('does not mark message as processed when publish fails', async () => {
    mockPrismaService.outboxMessage.findMany.mockResolvedValue([
      {
        id: 'msg-1',
        eventType: 'transaction.created',
        payload: { eventId: 'e1' },
      },
      {
        id: 'msg-2',
        eventType: 'transaction.deleted',
        payload: { eventId: 'e2' },
      },
    ]);
    mockClient.emit.mockReturnValueOnce(
      throwError(() => new Error('rmq down')),
    );

    await worker.processPendingMessages();

    expect(mockPrismaService.outboxMessage.updateMany).not.toHaveBeenCalled();
    expect(mockClient.emit).toHaveBeenCalledTimes(1);
  });

  it('does nothing when a previous poll is still running', async () => {
    let releaseFirstRun: () => void;

    mockPrismaService.outboxMessage.findMany.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseFirstRun = () => resolve([]);
        }),
    );

    const firstRun = worker.processPendingMessages();
    await worker.processPendingMessages();

    releaseFirstRun!();
    await firstRun;

    expect(mockPrismaService.outboxMessage.findMany).toHaveBeenCalledTimes(1);
  });
});
