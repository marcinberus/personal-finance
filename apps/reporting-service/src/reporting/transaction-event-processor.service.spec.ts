import { Test, TestingModule } from '@nestjs/testing';
import {
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@app/contracts';
import { ReportingProjectionService } from './reporting-projection.service';
import { TransactionEventProcessorService } from './transaction-event-processor.service';

const mockProjectionService = {
  applyTransactionCreated: jest.fn(),
  applyTransactionDeleted: jest.fn(),
};

describe('TransactionEventProcessorService', () => {
  let service: TransactionEventProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionEventProcessorService,
        {
          provide: ReportingProjectionService,
          useValue: mockProjectionService,
        },
      ],
    }).compile();

    service = module.get<TransactionEventProcessorService>(
      TransactionEventProcessorService,
    );
    jest.clearAllMocks();
  });

  it('should delegate transaction created payload and context to projection service', async () => {
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

    expect(mockProjectionService.applyTransactionCreated).toHaveBeenCalledWith(
      event.payload,
      {
        eventName: 'transaction.created',
        eventId: event.eventId,
        occurredAt: event.occurredAt,
        correlationId: event.correlationId,
      },
    );
  });

  it('should delegate transaction deleted payload and context to projection service', async () => {
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

    expect(mockProjectionService.applyTransactionDeleted).toHaveBeenCalledWith(
      event.payload,
      {
        eventName: 'transaction.deleted',
        eventId: event.eventId,
        occurredAt: event.occurredAt,
        correlationId: undefined,
      },
    );
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
    expect(
      mockProjectionService.applyTransactionDeleted,
    ).not.toHaveBeenCalled();
  });
});
