import { Test, TestingModule } from '@nestjs/testing';
import {
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@app/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { ReportingProjectionService } from './reporting-projection.service';
import { TransactionEventProcessorService } from './transaction-event-processor.service';

const mockProjectionService = {
  applyTransactionCreated: jest.fn(),
  applyTransactionDeleted: jest.fn(),
};

const mockTx = {
  $executeRaw: jest.fn(),
};

type TransactionCallback = (tx: typeof mockTx) => Promise<unknown>;

const mockPrismaService: {
  $transaction: jest.Mock<Promise<unknown>, [TransactionCallback]>;
} = {
  $transaction: jest.fn<Promise<unknown>, [TransactionCallback]>(),
};

describe('TransactionEventProcessorService', () => {
  let service: TransactionEventProcessorService;

  beforeEach(async () => {
    mockPrismaService.$transaction.mockImplementation((callback) =>
      callback(mockTx),
    );
    mockTx.$executeRaw.mockResolvedValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionEventProcessorService,
        {
          provide: ReportingProjectionService,
          useValue: mockProjectionService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransactionEventProcessorService>(
      TransactionEventProcessorService,
    );
    jest.clearAllMocks();
  });

  it('should delegate transaction created payload to projection service', async () => {
    const event: TransactionCreatedEvent = {
      eventId: 'evt-1',
      occurredAt: '2026-04-12T10:00:00.000Z',
      correlationId: 'corr-1',
      payload: {
        transactionId: 'tx-1',
        userId: 'user-1',
        categoryId: 'cat-1',
        categoryName: 'Salary',
        amount: '1000.00',
        type: 'income',
        description: null,
        transactionDate: '2026-04-12',
        createdAt: '2026-04-12T10:00:00.000Z',
      },
    };

    await service.handleTransactionCreated(event);

    expect(mockTx.$executeRaw).toHaveBeenCalled();
    expect(mockProjectionService.applyTransactionCreated).toHaveBeenCalledWith(
      event.payload,
      mockTx,
    );
  });

  it('should delegate transaction deleted payload to projection service', async () => {
    const event: TransactionDeletedEvent = {
      eventId: 'evt-2',
      occurredAt: '2026-04-12T10:05:00.000Z',
      payload: {
        transactionId: 'tx-2',
        userId: 'user-1',
        categoryId: 'cat-2',
        categoryName: 'Groceries',
        amount: '200.00',
        type: 'expense',
        transactionDate: '2026-04-12',
        deletedAt: '2026-04-12T10:05:00.000Z',
      },
    };

    await service.handleTransactionDeleted(event);

    expect(mockTx.$executeRaw).toHaveBeenCalled();
    expect(mockProjectionService.applyTransactionDeleted).toHaveBeenCalledWith(
      event.payload,
      mockTx,
    );
  });

  it('should ignore duplicate deliveries and skip projection update', async () => {
    mockTx.$executeRaw.mockResolvedValue(0);

    const event: TransactionCreatedEvent = {
      eventId: 'evt-dup',
      occurredAt: '2026-04-12T10:00:00.000Z',
      payload: {
        transactionId: 'tx-1',
        userId: 'user-1',
        categoryId: 'cat-1',
        categoryName: 'Salary',
        amount: '1000.00',
        type: 'income',
        description: null,
        transactionDate: '2026-04-12',
        createdAt: '2026-04-12T10:00:00.000Z',
      },
    };

    await service.handleTransactionCreated(event);

    expect(mockTx.$executeRaw).toHaveBeenCalled();
    expect(
      mockProjectionService.applyTransactionCreated,
    ).not.toHaveBeenCalled();
  });

  it('should reject invalid event envelopes', async () => {
    const invalidEvent = {
      occurredAt: '2026-04-12T10:05:00.000Z',
      payload: {
        transactionId: 'tx-2',
      },
    } as unknown as TransactionDeletedEvent;

    await expect(
      service.handleTransactionDeleted(invalidEvent),
    ).rejects.toThrow('Invalid transaction.deleted event envelope');
    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    expect(
      mockProjectionService.applyTransactionDeleted,
    ).not.toHaveBeenCalled();
  });
});
