import { Test, TestingModule } from '@nestjs/testing';
import {
  TransactionCreatedPayload,
  TransactionDeletedPayload,
} from '@app/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { ReportingProjectionService } from './reporting-projection.service';

const mockPrismaService = {
  monthlyReportProjection: {
    upsert: jest.fn(),
    updateMany: jest.fn(),
  },
  categorySpendProjection: {
    upsert: jest.fn(),
    updateMany: jest.fn(),
  },
};

describe('ReportingProjectionService', () => {
  let service: ReportingProjectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingProjectionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReportingProjectionService>(
      ReportingProjectionService,
    );
    jest.clearAllMocks();
  });

  describe('applyTransactionCreated', () => {
    it('should upsert monthly projection for income and skip category projection', async () => {
      const payload: TransactionCreatedPayload = {
        transactionId: 'tx-1',
        userId: 'user-1',
        categoryId: 'cat-1',
        categoryName: 'Salary',
        amount: '1000.00',
        type: 'income',
        description: null,
        transactionDate: '2026-04-15',
        createdAt: '2026-04-15T10:00:00.000Z',
      };

      await service.applyTransactionCreated(payload);

      expect(
        mockPrismaService.monthlyReportProjection.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId_year_month: {
            userId: 'user-1',
            year: 2026,
            month: 4,
          },
        },
        create: {
          userId: 'user-1',
          year: 2026,
          month: 4,
          incomeTotal: '1000.00',
          expenseTotal: 0,
        },
        update: {
          incomeTotal: { increment: '1000.00' },
        },
      });
      expect(
        mockPrismaService.categorySpendProjection.upsert,
      ).not.toHaveBeenCalled();
    });

    it('should upsert both monthly and category projections for expense', async () => {
      const payload: TransactionCreatedPayload = {
        transactionId: 'tx-2',
        userId: 'user-1',
        categoryId: 'cat-2',
        categoryName: 'Groceries',
        amount: '250.50',
        type: 'expense',
        description: 'Weekly shopping',
        transactionDate: '2026-04-20',
        createdAt: '2026-04-20T11:00:00.000Z',
      };

      await service.applyTransactionCreated(payload);

      expect(
        mockPrismaService.monthlyReportProjection.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId_year_month: {
            userId: 'user-1',
            year: 2026,
            month: 4,
          },
        },
        create: {
          userId: 'user-1',
          year: 2026,
          month: 4,
          incomeTotal: 0,
          expenseTotal: '250.50',
        },
        update: {
          expenseTotal: { increment: '250.50' },
        },
      });
      expect(
        mockPrismaService.categorySpendProjection.upsert,
      ).toHaveBeenCalledWith({
        where: {
          userId_categoryId_year_month: {
            userId: 'user-1',
            categoryId: 'cat-2',
            year: 2026,
            month: 4,
          },
        },
        create: {
          userId: 'user-1',
          categoryId: 'cat-2',
          categoryName: 'Groceries',
          year: 2026,
          month: 4,
          total: '250.50',
        },
        update: {
          total: { increment: '250.50' },
          categoryName: 'Groceries',
        },
      });
    });
  });

  describe('applyTransactionDeleted', () => {
    it('should decrement monthly income for deleted income transaction', async () => {
      const payload: TransactionDeletedPayload = {
        transactionId: 'tx-3',
        userId: 'user-1',
        categoryId: 'cat-1',
        categoryName: 'Salary',
        amount: '1000.00',
        type: 'income',
        transactionDate: '2026-04-15',
        deletedAt: '2026-04-21T10:00:00.000Z',
      };

      await service.applyTransactionDeleted(payload);

      expect(
        mockPrismaService.monthlyReportProjection.updateMany,
      ).toHaveBeenCalledWith({
        where: { userId: 'user-1', year: 2026, month: 4 },
        data: { incomeTotal: { decrement: '1000.00' } },
      });
      expect(
        mockPrismaService.categorySpendProjection.updateMany,
      ).not.toHaveBeenCalled();
    });

    it('should decrement monthly and category totals for deleted expense transaction', async () => {
      const payload: TransactionDeletedPayload = {
        transactionId: 'tx-4',
        userId: 'user-1',
        categoryId: 'cat-2',
        categoryName: 'Groceries',
        amount: '250.50',
        type: 'expense',
        transactionDate: '2026-04-20',
        deletedAt: '2026-04-21T10:00:00.000Z',
      };

      await service.applyTransactionDeleted(payload);

      expect(
        mockPrismaService.monthlyReportProjection.updateMany,
      ).toHaveBeenCalledWith({
        where: { userId: 'user-1', year: 2026, month: 4 },
        data: { expenseTotal: { decrement: '250.50' } },
      });
      expect(
        mockPrismaService.categorySpendProjection.updateMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          categoryId: 'cat-2',
          year: 2026,
          month: 4,
        },
        data: { total: { decrement: '250.50' } },
      });
    });
  });
});
