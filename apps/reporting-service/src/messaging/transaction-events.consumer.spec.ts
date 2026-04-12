import { CorrelationIdService } from '@app/common';
import {
  TRANSACTION_CREATED,
  TRANSACTION_DELETED,
  type TransactionCreatedEvent,
  type TransactionDeletedEvent,
} from '@app/contracts';
import { TransactionEventsConsumer } from './transaction-events.consumer';
import { TransactionEventProcessorService } from '../reporting/transaction-event-processor.service';

const mockProcessor = {
  handleTransactionCreated: jest.fn(),
  handleTransactionDeleted: jest.fn(),
};

const mockCorrelationIdService = {
  runWithCorrelationId: jest.fn(),
  getCorrelationId: jest.fn(),
};

describe('TransactionEventsConsumer', () => {
  let consumer: TransactionEventsConsumer;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCorrelationIdService.runWithCorrelationId.mockImplementation(
      async (_correlationId: string | undefined, callback: () => unknown) =>
        await callback(),
    );
    mockCorrelationIdService.getCorrelationId.mockReturnValue('corr-log-1');

    consumer = new TransactionEventsConsumer(
      mockProcessor as unknown as TransactionEventProcessorService,
      mockCorrelationIdService as unknown as CorrelationIdService,
    );
  });

  it('should run transaction.created processing inside correlation context', async () => {
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

    await consumer.handleTransactionCreated(event);

    expect(mockCorrelationIdService.runWithCorrelationId).toHaveBeenCalledWith(
      'corr-1',
      expect.any(Function),
    );
    expect(mockProcessor.handleTransactionCreated).toHaveBeenCalledWith(event);
  });

  it('should run transaction.deleted processing inside correlation context', async () => {
    const event: TransactionDeletedEvent = {
      eventId: 'evt-2',
      occurredAt: '2026-04-12T10:05:00.000Z',
      correlationId: 'corr-2',
      payload: {
        transactionId: 'tx-2',
        userId: 'user-1',
        categoryId: 'cat-2',
        categoryName: 'Groceries',
        amount: '45.00',
        type: 'expense',
        transactionDate: '2026-04-12',
        deletedAt: '2026-04-12T10:05:00.000Z',
      },
    };

    await consumer.handleTransactionDeleted(event);

    expect(mockCorrelationIdService.runWithCorrelationId).toHaveBeenCalledWith(
      'corr-2',
      expect.any(Function),
    );
    expect(mockProcessor.handleTransactionDeleted).toHaveBeenCalledWith(event);
  });

  it('should log event metadata with correlation ID', async () => {
    const loggerLogSpy = jest
      .spyOn(
        (
          consumer as unknown as {
            logger: { log: (message: string) => void };
          }
        ).logger,
        'log',
      )
      .mockImplementation(() => undefined);

    const event: TransactionCreatedEvent = {
      eventId: 'evt-log',
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

    await consumer.handleTransactionCreated(event);

    expect(loggerLogSpy).toHaveBeenCalledWith(
      JSON.stringify({
        message: 'event.received',
        eventName: TRANSACTION_CREATED,
        eventId: 'evt-log',
        correlationId: 'corr-log-1',
      }),
    );

    loggerLogSpy.mockRestore();
  });

  it('should log deleted event metadata with correlation ID', async () => {
    const loggerLogSpy = jest
      .spyOn(
        (
          consumer as unknown as {
            logger: { log: (message: string) => void };
          }
        ).logger,
        'log',
      )
      .mockImplementation(() => undefined);

    const event: TransactionDeletedEvent = {
      eventId: 'evt-log-2',
      occurredAt: '2026-04-12T10:05:00.000Z',
      correlationId: 'corr-2',
      payload: {
        transactionId: 'tx-2',
        userId: 'user-1',
        categoryId: 'cat-2',
        categoryName: 'Groceries',
        amount: '45.00',
        type: 'expense',
        transactionDate: '2026-04-12',
        deletedAt: '2026-04-12T10:05:00.000Z',
      },
    };

    await consumer.handleTransactionDeleted(event);

    expect(loggerLogSpy).toHaveBeenCalledWith(
      JSON.stringify({
        message: 'event.received',
        eventName: TRANSACTION_DELETED,
        eventId: 'evt-log-2',
        correlationId: 'corr-log-1',
      }),
    );

    loggerLogSpy.mockRestore();
  });
});
