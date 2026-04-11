import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ReportingService } from './reporting.service';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto';
import { CategorySpendQueryDto } from './dto/category-spend-query.dto';

const mockPrismaService = {
  monthlyReportProjection: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  categorySpendProjection: {
    findMany: jest.fn(),
  },
};

describe('ReportingService', () => {
  let service: ReportingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
    jest.clearAllMocks();
  });

  describe('getMonthlyReport', () => {
    const userId = 'user-1';

    it('should return specific month report when month is provided', async () => {
      const query: MonthlyReportQueryDto = { year: 2026, month: 4 };
      mockPrismaService.monthlyReportProjection.findUnique.mockResolvedValue({
        userId,
        year: 2026,
        month: 4,
        incomeTotal: '1500.00',
        expenseTotal: '400.00',
      });

      const result = await service.getMonthlyReport(userId, query);

      expect(
        mockPrismaService.monthlyReportProjection.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          userId_year_month: { userId, year: 2026, month: 4 },
        },
      });
      expect(result).toEqual({
        year: 2026,
        month: 4,
        incomeTotal: '1500.00',
        expenseTotal: '400.00',
        balance: '1100.00',
      });
    });

    it('should return zero totals when specific month projection does not exist', async () => {
      const query: MonthlyReportQueryDto = { year: 2026, month: 12 };
      mockPrismaService.monthlyReportProjection.findUnique.mockResolvedValue(
        null,
      );

      const result = await service.getMonthlyReport(userId, query);

      expect(result).toEqual({
        year: 2026,
        month: 12,
        incomeTotal: '0.00',
        expenseTotal: '0.00',
        balance: '0.00',
      });
    });

    it('should return year-to-date aggregate when month is not provided', async () => {
      const query: MonthlyReportQueryDto = { year: 2026 };
      mockPrismaService.monthlyReportProjection.findMany.mockResolvedValue([
        {
          incomeTotal: '1000.00',
          expenseTotal: '250.00',
        },
        {
          incomeTotal: '500.00',
          expenseTotal: '50.00',
        },
      ]);

      const result = await service.getMonthlyReport(userId, query);

      expect(
        mockPrismaService.monthlyReportProjection.findMany,
      ).toHaveBeenCalledWith({
        where: { userId, year: 2026 },
      });
      expect(result).toEqual({
        year: 2026,
        month: null,
        incomeTotal: '1500.00',
        expenseTotal: '300.00',
        balance: '1200.00',
      });
    });

    it('should return zero aggregate for year with no rows', async () => {
      const query: MonthlyReportQueryDto = { year: 2026 };
      mockPrismaService.monthlyReportProjection.findMany.mockResolvedValue([]);

      const result = await service.getMonthlyReport(userId, query);

      expect(result).toEqual({
        year: 2026,
        month: null,
        incomeTotal: '0.00',
        expenseTotal: '0.00',
        balance: '0.00',
      });
    });
  });

  describe('getCategorySpend', () => {
    it('should return category spend mapped to response DTO', async () => {
      const userId = 'user-1';
      const query: CategorySpendQueryDto = { year: 2026, month: 4 };
      mockPrismaService.categorySpendProjection.findMany.mockResolvedValue([
        {
          categoryId: 'cat-1',
          categoryName: 'Groceries',
          total: '500',
        },
        {
          categoryId: 'cat-2',
          categoryName: 'Utilities',
          total: '150.5',
        },
      ]);

      const result = await service.getCategorySpend(userId, query);

      expect(
        mockPrismaService.categorySpendProjection.findMany,
      ).toHaveBeenCalledWith({
        where: { userId, year: 2026, month: 4 },
        orderBy: { total: 'desc' },
      });
      expect(result).toEqual([
        { categoryId: 'cat-1', categoryName: 'Groceries', total: '500.00' },
        { categoryId: 'cat-2', categoryName: 'Utilities', total: '150.50' },
      ]);
    });
  });
});
