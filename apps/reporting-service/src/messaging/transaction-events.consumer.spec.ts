import { CorrelationIdService } from '@app/common';
import {
  TRANSACTION_CREATED,
  TRANSACTION_DELETED,
  type TransactionCreatedEvent,
  type TransactionDeletedEvent,
} from '@app/contracts';
import { RmqContext } from '@nestjs/microservices';
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

  const createMockRmqContext = (): {
    context: RmqContext;
    ack: jest.Mock;
    nack: jest.Mock;
    message: object;
  } => {
    const ack = jest.fn();
    const nack = jest.fn();
    const message = { fields: { deliveryTag: 1 } };

    const context = {
      getChannelRef: () => ({ ack, nack }),
      getMessage: () => message,
    } as unknown as RmqContext;

    return { context, ack, nack, message };
  };

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

    const { context, ack, nack, message } = createMockRmqContext();

    await consumer.handleTransactionCreated(event, context);

    expect(mockCorrelationIdService.runWithCorrelationId).toHaveBeenCalledWith(
      'corr-1',
      expect.any(Function),
    );
    expect(mockProcessor.handleTransactionCreated).toHaveBeenCalledWith(event);
    expect(ack).toHaveBeenCalledWith(message);
    expect(nack).not.toHaveBeenCalled();
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

    const { context, ack, nack, message } = createMockRmqContext();

    await consumer.handleTransactionDeleted(event, context);

    expect(mockCorrelationIdService.runWithCorrelationId).toHaveBeenCalledWith(
      'corr-2',
      expect.any(Function),
    );
    expect(mockProcessor.handleTransactionDeleted).toHaveBeenCalledWith(event);
    expect(ack).toHaveBeenCalledWith(message);
    expect(nack).not.toHaveBeenCalled();
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

    const { context } = createMockRmqContext();

    await consumer.handleTransactionCreated(event, context);

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

    const { context } = createMockRmqContext();

    await consumer.handleTransactionDeleted(event, context);

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

  it('should nack and requeue when transaction.created processing fails', async () => {
    const event: TransactionCreatedEvent = {
      eventId: 'evt-fail-1',
      occurredAt: '2026-04-12T10:00:00.000Z',
      correlationId: 'corr-fail-1',
      payload: {
        transactionId: 'tx-fail-1',
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

    mockProcessor.handleTransactionCreated.mockRejectedValueOnce(
      new Error('projection update failed'),
    );

    const loggerErrorSpy = jest
      .spyOn(
        (
          consumer as unknown as {
            logger: { error: (message: string, trace?: string) => void };
          }
        ).logger,
        'error',
      )
      .mockImplementation(() => undefined);

    const { context, ack, nack, message } = createMockRmqContext();

    await consumer.handleTransactionCreated(event, context);

    expect(ack).not.toHaveBeenCalled();
    expect(nack).toHaveBeenCalledWith(message, false, true);
    expect(loggerErrorSpy).toHaveBeenCalled();

    loggerErrorSpy.mockRestore();
  });
});
