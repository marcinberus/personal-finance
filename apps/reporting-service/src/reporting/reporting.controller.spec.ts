import { Test, TestingModule } from '@nestjs/testing';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto';
import { CategorySpendQueryDto } from './dto/category-spend-query.dto';

const mockReportingService = {
  getMonthlyReport: jest.fn(),
  getCategorySpend: jest.fn(),
};

describe('ReportingController', () => {
  let controller: ReportingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportingController],
      providers: [
        { provide: ReportingService, useValue: mockReportingService },
      ],
    }).compile();

    controller = module.get<ReportingController>(ReportingController);
    jest.clearAllMocks();
  });

  describe('getMonthlyReport', () => {
    it('should delegate to reportingService.getMonthlyReport', async () => {
      const user = { id: 'user-1', email: 'user@example.com' };
      const query: MonthlyReportQueryDto = { year: 2026, month: 4 };
      const response = {
        year: 2026,
        month: 4,
        incomeTotal: '1000.00',
        expenseTotal: '250.00',
        balance: '750.00',
      };
      mockReportingService.getMonthlyReport.mockResolvedValue(response);

      const result = await controller.getMonthlyReport(user, query);

      expect(mockReportingService.getMonthlyReport).toHaveBeenCalledWith(
        user.id,
        query,
      );
      expect(result).toEqual(response);
    });
  });

  describe('getCategorySpend', () => {
    it('should delegate to reportingService.getCategorySpend', async () => {
      const user = { id: 'user-1', email: 'user@example.com' };
      const query: CategorySpendQueryDto = { year: 2026, month: 4 };
      const response = [
        { categoryId: 'cat-1', categoryName: 'Groceries', total: '500.00' },
      ];
      mockReportingService.getCategorySpend.mockResolvedValue(response);

      const result = await controller.getCategorySpend(user, query);

      expect(mockReportingService.getCategorySpend).toHaveBeenCalledWith(
        user.id,
        query,
      );
      expect(result).toEqual(response);
    });
  });
});
