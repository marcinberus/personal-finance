import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { ReportingProjectionService } from '../../../../src/reporting/reporting-projection.service';
import type {
  TransactionCreatedPayload,
  TransactionDeletedPayload,
} from '@app/contracts';
import { cleanDatabase } from '../database';

describe('ReportingProjectionService (Integration)', () => {
  let module: TestingModule;
  let prisma: PrismaService;
  let projectionService: ReportingProjectionService;

  const userId = 'test-user-id';
  const categoryId = 'test-category-id';
  const categoryName = 'Groceries';
  const transactionDate = '2026-04-15';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
      ],
      providers: [ReportingProjectionService],
    }).compile();

    prisma = module.get(PrismaService);
    projectionService = module.get(ReportingProjectionService);
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(async () => {
    await cleanDatabase(prisma);
  });

  describe('applyTransactionCreated', () => {
    describe('income transaction', () => {
      it('should create a new monthly report projection with income amount', async () => {
        const payload: TransactionCreatedPayload = {
          transactionId: 'txn-1',
          userId,
          categoryId,
          categoryName,
          amount: '500.00',
          type: 'income',
          transactionDate,
          description: null,
          createdAt: '',
        };

        await projectionService.applyTransactionCreated(payload);

        const projection = await prisma.monthlyReportProjection.findUnique({
          where: { userId_year_month: { userId, year: 2026, month: 4 } },
        });

        expect(projection).toBeDefined();
        expect(parseFloat(String(projection?.incomeTotal)).toFixed(2)).toBe(
          '500.00',
        );
        expect(parseFloat(String(projection?.expenseTotal)).toFixed(2)).toBe(
          '0.00',
        );
      });

      it('should increment income on existing monthly projection', async () => {
        const payload1: TransactionCreatedPayload = {
          transactionId: 'txn-2',
          userId: 'user-2',
          categoryId,
          categoryName,
          amount: '300.00',
          type: 'income',
          transactionDate,
          description: null,
          createdAt: '',
        };

        const payload2: TransactionCreatedPayload = {
          transactionId: 'txn-3',
          userId: 'user-2',
          categoryId,
          categoryName,
          amount: '200.00',
          type: 'income',
          transactionDate,
          description: null,
          createdAt: '',
        };

        await projectionService.applyTransactionCreated(payload1);
        await projectionService.applyTransactionCreated(payload2);

        const projection = await prisma.monthlyReportProjection.findUnique({
          where: {
            userId_year_month: { userId: 'user-2', year: 2026, month: 4 },
          },
        });

        expect(projection).toBeDefined();
        expect(parseFloat(String(projection?.incomeTotal)).toFixed(2)).toBe(
          '500.00',
        );
      });

      it('should not create category spend projection for income', async () => {
        const payload: TransactionCreatedPayload = {
          transactionId: 'txn-4',
          userId: 'user-3',
          categoryId,
          categoryName,
          amount: '100.00',
          type: 'income',
          transactionDate,
          description: null,
          createdAt: '',
        };

        await projectionService.applyTransactionCreated(payload);

        const spends = await prisma.categorySpendProjection.findMany({
          where: { userId: 'user-3' },
        });

        expect(spends).toHaveLength(0);
      });
    });

    describe('expense transaction', () => {
      it('should create monthly and category spend projections for expense', async () => {
        const payload: TransactionCreatedPayload = {
          transactionId: 'txn-5',
          userId: 'user-4',
          categoryId: 'groceries-id',
          categoryName: 'Groceries',
          amount: '75.50',
          type: 'expense',
          transactionDate,
          description: null,
          createdAt: '',
        };

        await projectionService.applyTransactionCreated(payload);

        const monthly = await prisma.monthlyReportProjection.findUnique({
          where: {
            userId_year_month: { userId: 'user-4', year: 2026, month: 4 },
          },
        });

        const spend = await prisma.categorySpendProjection.findUnique({
          where: {
            userId_categoryId_year_month: {
              userId: 'user-4',
              categoryId: 'groceries-id',
              year: 2026,
              month: 4,
            },
          },
        });

        expect(monthly).toBeDefined();
        expect(parseFloat(String(monthly?.expenseTotal)).toFixed(2)).toBe(
          '75.50',
        );
        expect(parseFloat(String(monthly?.incomeTotal)).toFixed(2)).toBe(
          '0.00',
        );

        expect(spend).toBeDefined();
        expect(parseFloat(String(spend?.total)).toFixed(2)).toBe('75.50');
        expect(spend?.categoryName).toBe('Groceries');
      });

      it('should increment expense amounts on existing projections', async () => {
        const userId = 'user-5';
        const categoryId = 'groceries-id';

        const payload1: TransactionCreatedPayload = {
          transactionId: 'txn-6',
          userId,
          categoryId,
          categoryName: 'Groceries',
          amount: '50.00',
          type: 'expense',
          transactionDate,
          description: null,
          createdAt: '',
        };

        const payload2: TransactionCreatedPayload = {
          transactionId: 'txn-7',
          userId,
          categoryId,
          categoryName: 'Groceries',
          amount: '30.00',
          type: 'expense',
          transactionDate,
          description: null,
          createdAt: '',
        };

        await projectionService.applyTransactionCreated(payload1);
        await projectionService.applyTransactionCreated(payload2);

        const monthly = await prisma.monthlyReportProjection.findUnique({
          where: { userId_year_month: { userId, year: 2026, month: 4 } },
        });

        const spend = await prisma.categorySpendProjection.findUnique({
          where: {
            userId_categoryId_year_month: {
              userId,
              categoryId,
              year: 2026,
              month: 4,
            },
          },
        });

        expect(parseFloat(String(monthly?.expenseTotal)).toFixed(2)).toBe(
          '80.00',
        );
        expect(parseFloat(String(spend?.total)).toFixed(2)).toBe('80.00');
      });

      it('should handle multiple categories in same month', async () => {
        const userId = 'user-6';

        const groceries: TransactionCreatedPayload = {
          transactionId: 'txn-8',
          userId,
          categoryId: 'groceries-id',
          categoryName: 'Groceries',
          amount: '100.00',
          type: 'expense',
          transactionDate,
          description: null,
          createdAt: '',
        };

        const utilities: TransactionCreatedPayload = {
          transactionId: 'txn-9',
          userId,
          categoryId: 'utilities-id',
          categoryName: 'Utilities',
          amount: '80.00',
          type: 'expense',
          transactionDate,
          description: null,
          createdAt: '',
        };

        await projectionService.applyTransactionCreated(groceries);
        await projectionService.applyTransactionCreated(utilities);

        const monthly = await prisma.monthlyReportProjection.findUnique({
          where: { userId_year_month: { userId, year: 2026, month: 4 } },
        });

        const spends = await prisma.categorySpendProjection.findMany({
          where: { userId, year: 2026, month: 4 },
        });

        expect(parseFloat(String(monthly?.expenseTotal)).toFixed(2)).toBe(
          '180.00',
        );
        expect(spends).toHaveLength(2);
      });
    });
  });

  describe('applyTransactionDeleted', () => {
    describe('income transaction deletion', () => {
      it('should decrement income on monthly projection', async () => {
        const userId = 'user-7';

        // Create income
        const createPayload: TransactionCreatedPayload = {
          transactionId: 'txn-10',
          userId,
          categoryId,
          categoryName,
          amount: '500.00',
          type: 'income',
          transactionDate,
          description: null,
          createdAt: '',
        };

        await projectionService.applyTransactionCreated(createPayload);

        // Delete income
        const deletePayload: TransactionDeletedPayload = {
          transactionId: 'txn-10',
          userId,
          categoryId,
          categoryName,
          amount: '500.00',
          type: 'income',
          transactionDate,
          deletedAt: new Date().toISOString(),
        };

        await projectionService.applyTransactionDeleted(deletePayload);

        const projection = await prisma.monthlyReportProjection.findUnique({
          where: { userId_year_month: { userId, year: 2026, month: 4 } },
        });

        expect(parseFloat(String(projection?.incomeTotal)).toFixed(2)).toBe(
          '0.00',
        );
      });
    });

    describe('expense transaction deletion', () => {
      it('should decrement expense amounts on projections', async () => {
        const userId = 'user-8';
        const categoryId = 'groceries-id';

        // Create expensive transactions
        const createPayload1: TransactionCreatedPayload = {
          transactionId: 'txn-11',
          userId,
          categoryId,
          categoryName: 'Groceries',
          amount: '100.00',
          type: 'expense',
          transactionDate,
          description: null,
          createdAt: '',
        };

        const createPayload2: TransactionCreatedPayload = {
          transactionId: 'txn-12',
          userId,
          categoryId,
          categoryName: 'Groceries',
          amount: '50.00',
          type: 'expense',
          transactionDate,
          description: null,
          createdAt: '',
        };

        await projectionService.applyTransactionCreated(createPayload1);
        await projectionService.applyTransactionCreated(createPayload2);

        // Delete one transaction
        const deletePayload: TransactionDeletedPayload = {
          transactionId: 'txn-11',
          userId,
          categoryId,
          categoryName: 'Groceries',
          amount: '100.00',
          type: 'expense',
          transactionDate,
          deletedAt: new Date().toISOString(),
        };

        await projectionService.applyTransactionDeleted(deletePayload);

        const monthly = await prisma.monthlyReportProjection.findUnique({
          where: { userId_year_month: { userId, year: 2026, month: 4 } },
        });

        const spend = await prisma.categorySpendProjection.findUnique({
          where: {
            userId_categoryId_year_month: {
              userId,
              categoryId,
              year: 2026,
              month: 4,
            },
          },
        });

        expect(parseFloat(String(monthly?.expenseTotal)).toFixed(2)).toBe(
          '50.00',
        );
        expect(parseFloat(String(spend?.total)).toFixed(2)).toBe('50.00');
      });

      it('should not update category spend for income deletion', async () => {
        const userId = 'user-9';

        // Create income
        const createPayload: TransactionCreatedPayload = {
          transactionId: 'txn-13',
          userId,
          categoryId,
          categoryName,
          amount: '1000.00',
          type: 'income',
          transactionDate,
          description: null,
          createdAt: '',
        };

        await projectionService.applyTransactionCreated(createPayload);

        // Delete income
        const deletePayload: TransactionDeletedPayload = {
          transactionId: 'txn-13',
          userId,
          categoryId,
          categoryName,
          amount: '1000.00',
          type: 'income',
          transactionDate,
          deletedAt: new Date().toISOString(),
        };

        await projectionService.applyTransactionDeleted(deletePayload);

        const spends = await prisma.categorySpendProjection.findMany({
          where: { userId },
        });

        expect(spends).toHaveLength(0);
      });
    });
  });
});
