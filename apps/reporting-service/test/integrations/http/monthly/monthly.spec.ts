import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppTestContext } from '../base/app-context';
import {
  TEST_USER,
  TEST_MONTHLY_REPORT_APRIL,
  TEST_MONTHLY_REPORT_YTD,
} from '../base/fixtures';

describe('Reporting - Monthly Reports (HTTP)', () => {
  let context: AppTestContext;
  let validToken: string;

  beforeAll(async () => {
    context = new AppTestContext();
    await context.setupTestingModule();
    await context.app.init();

    // Generate valid JWT token
    validToken = jwt.sign(
      { sub: TEST_USER.id, email: TEST_USER.email },
      process.env.JWT_SECRET || 'test-jwt-secret-key-super-secret',
      { expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    await context.cleanup();
  });

  describe('GET /api/reports/monthly', () => {
    beforeEach(() => {
      // Reset mock between tests
      context.mockPrismaService.monthlyReportProjection.findUnique.mockClear();
      context.mockPrismaService.monthlyReportProjection.findMany.mockClear();
    });

    it('should require authentication', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/api/reports/monthly')
        .query({ year: 2026 });

      expect(response.status).toBe(401);
    });

    it('should return monthly report for specific month', async () => {
      // Mock the raw projection data from Prisma
      context.mockPrismaService.monthlyReportProjection.findUnique.mockResolvedValueOnce(
        {
          userId: TEST_USER.id,
          year: 2026,
          month: 4,
          incomeTotal: '5000.00',
          expenseTotal: '2500.00',
        },
      );

      const response = await request(context.app.getHttpServer())
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026, month: 4 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(TEST_MONTHLY_REPORT_APRIL);
      expect(
        context.mockPrismaService.monthlyReportProjection.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          userId_year_month: {
            userId: TEST_USER.id,
            year: 2026,
            month: 4,
          },
        },
      });
    });

    it('should return year-to-date report when month omitted', async () => {
      // Mock the raw projection data for multiple months
      context.mockPrismaService.monthlyReportProjection.findMany.mockResolvedValueOnce(
        [
          {
            userId: TEST_USER.id,
            year: 2026,
            month: 4,
            incomeTotal: '5000.00',
            expenseTotal: '2500.00',
          },
          {
            userId: TEST_USER.id,
            year: 2026,
            month: 5,
            incomeTotal: '5500.00',
            expenseTotal: '2800.00',
          },
        ],
      );

      const response = await request(context.app.getHttpServer())
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(TEST_MONTHLY_REPORT_YTD);
      expect(
        context.mockPrismaService.monthlyReportProjection.findMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: TEST_USER.id,
          year: 2026,
        },
      });
    });

    it('should require year parameter', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(400);
    });

    it('should return zero totals when no reports found for specific month', async () => {
      context.mockPrismaService.monthlyReportProjection.findUnique.mockResolvedValueOnce(
        null,
      );

      const response = await request(context.app.getHttpServer())
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026, month: 12 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        year: 2026,
        month: 12,
        incomeTotal: '0.00',
        expenseTotal: '0.00',
        balance: '0.00',
      });
    });

    it('should validate year is a number', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should validate month is a number when provided', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026, month: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should filter by authenticated user', async () => {
      context.mockPrismaService.monthlyReportProjection.findUnique.mockResolvedValueOnce(
        null,
      );

      const response = await request(context.app.getHttpServer())
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026, month: 4 });

      expect(response.status).toBe(200);
      // Verify that the query used the authenticated user's ID
      const calls = context.mockPrismaService.monthlyReportProjection.findUnique
        .mock.calls as Array<
        [
          {
            where: {
              userId_year_month: {
                userId: string;
              };
            };
          },
        ]
      >;
      const callArgs = calls[0][0];
      expect(callArgs.where.userId_year_month.userId).toBe(TEST_USER.id);
    });

    it('should return empty array for year-to-date when no data found', async () => {
      context.mockPrismaService.monthlyReportProjection.findMany.mockResolvedValueOnce(
        [],
      );

      const response = await request(context.app.getHttpServer())
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        year: 2026,
        month: null,
        incomeTotal: '0.00',
        expenseTotal: '0.00',
        balance: '0.00',
      });
    });
  });
});
