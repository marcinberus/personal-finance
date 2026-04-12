import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type {
  TransactionCreatedEvent,
  TransactionDeletedEvent,
} from '@app/contracts';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { TransactionEventProcessorService } from '../../../../src/reporting/transaction-event-processor.service';
import { ReportingProjectionService } from '../../../../src/reporting/reporting-projection.service';
import { cleanDatabase } from '../database';

describe('TransactionEventProcessorService (Integration)', () => {
  let module: TestingModule;
  let prisma: PrismaService;
  let processor: TransactionEventProcessorService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
      ],
      providers: [ReportingProjectionService, TransactionEventProcessorService],
    }).compile();

    prisma = module.get(PrismaService);
    processor = module.get(TransactionEventProcessorService);
  });

  afterEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should apply transaction.created projection exactly once for duplicate deliveries', async () => {
    const event: TransactionCreatedEvent = {
      eventId: 'evt-created-1',
      occurredAt: '2026-04-12T10:00:00.000Z',
      correlationId: 'corr-1',
      payload: {
        transactionId: 'tx-1',
        userId: 'user-1',
        categoryId: 'cat-income',
        categoryName: 'Salary',
        amount: '1000.00',
        type: 'income',
        description: null,
        transactionDate: '2026-04-12',
        createdAt: '2026-04-12T10:00:00.000Z',
      },
    };

    await processor.handleTransactionCreated(event);
    await processor.handleTransactionCreated(event);

    const monthly = await prisma.monthlyReportProjection.findUnique({
      where: {
        userId_year_month: {
          userId: event.payload.userId,
          year: 2026,
          month: 4,
        },
      },
    });

    const inboxRows = await prisma.$queryRaw<
      { count: bigint | number }[]
    >`SELECT COUNT(*) AS count FROM "ProjectionInboxEvent" WHERE "eventId" = ${event.eventId} AND "eventName" = 'transaction.created'`;

    expect(parseFloat(String(monthly?.incomeTotal)).toFixed(2)).toBe('1000.00');
    expect(Number(inboxRows[0]?.count ?? 0)).toBe(1);
  });

  it('should apply transaction.deleted projection exactly once for duplicate deliveries', async () => {
    const createEvent: TransactionCreatedEvent = {
      eventId: 'evt-created-2',
      occurredAt: '2026-04-12T10:00:00.000Z',
      payload: {
        transactionId: 'tx-2',
        userId: 'user-2',
        categoryId: 'cat-expense',
        categoryName: 'Groceries',
        amount: '300.00',
        type: 'expense',
        description: null,
        transactionDate: '2026-04-12',
        createdAt: '2026-04-12T10:00:00.000Z',
      },
    };

    const deleteEvent: TransactionDeletedEvent = {
      eventId: 'evt-deleted-2',
      occurredAt: '2026-04-12T10:05:00.000Z',
      payload: {
        transactionId: 'tx-2',
        userId: 'user-2',
        categoryId: 'cat-expense',
        categoryName: 'Groceries',
        amount: '300.00',
        type: 'expense',
        transactionDate: '2026-04-12',
        deletedAt: '2026-04-12T10:05:00.000Z',
      },
    };

    await processor.handleTransactionCreated(createEvent);
    await processor.handleTransactionDeleted(deleteEvent);
    await processor.handleTransactionDeleted(deleteEvent);

    const monthly = await prisma.monthlyReportProjection.findUnique({
      where: {
        userId_year_month: {
          userId: deleteEvent.payload.userId,
          year: 2026,
          month: 4,
        },
      },
    });

    const spend = await prisma.categorySpendProjection.findUnique({
      where: {
        userId_categoryId_year_month: {
          userId: deleteEvent.payload.userId,
          categoryId: deleteEvent.payload.categoryId,
          year: 2026,
          month: 4,
        },
      },
    });

    const inboxRows = await prisma.$queryRaw<
      { count: bigint | number }[]
    >`SELECT COUNT(*) AS count FROM "ProjectionInboxEvent" WHERE "eventId" = ${deleteEvent.eventId} AND "eventName" = 'transaction.deleted'`;

    expect(parseFloat(String(monthly?.expenseTotal)).toFixed(2)).toBe('0.00');
    expect(parseFloat(String(spend?.total)).toFixed(2)).toBe('0.00');
    expect(Number(inboxRows[0]?.count ?? 0)).toBe(1);
  });
});
