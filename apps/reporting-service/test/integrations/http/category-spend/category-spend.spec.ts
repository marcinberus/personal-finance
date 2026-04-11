import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppTestContext } from '../base/app-context';
import {
  TEST_USER,
  TEST_CATEGORY_SPEND_GROCERIES,
  TEST_CATEGORY_SPEND_UTILITIES,
} from '../base/fixtures';

describe('Reporting - Category Spend (HTTP)', () => {
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

  describe('GET /api/reports/category-spend', () => {
    beforeEach(() => {
      // Reset mock between tests
      context.mockPrismaService.categorySpendProjection.findMany.mockClear();
    });

    it('should require authentication', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/api/reports/category-spend')
        .query({ year: 2026, month: 4 });

      expect(response.status).toBe(401);
    });

    it('should return category spend for specified month', async () => {
      // Mock the raw projection data from Prisma
      context.mockPrismaService.categorySpendProjection.findMany.mockResolvedValueOnce(
        [
          {
            userId: TEST_USER.id,
            categoryId: 'category-groceries',
            categoryName: 'Groceries',
            year: 2026,
            month: 4,
            total: '500.00',
          },
          {
            userId: TEST_USER.id,
            categoryId: 'category-utilities',
            categoryName: 'Utilities',
            year: 2026,
            month: 4,
            total: '150.00',
          },
        ],
      );

      const response = await request(context.app.getHttpServer())
        .get('/api/reports/category-spend')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026, month: 4 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        TEST_CATEGORY_SPEND_GROCERIES,
        TEST_CATEGORY_SPEND_UTILITIES,
      ]);
      expect(
        context.mockPrismaService.categorySpendProjection.findMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: TEST_USER.id,
          year: 2026,
          month: 4,
        },
        orderBy: { total: 'desc' },
      });
    });

    it('should require both year and month parameters', async () => {
      let response = await request(context.app.getHttpServer())
        .get('/api/reports/category-spend')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026 });

      expect(response.status).toBe(400);

      response = await request(context.app.getHttpServer())
        .get('/api/reports/category-spend')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ month: 4 });

      expect(response.status).toBe(400);

      response = await request(context.app.getHttpServer())
        .get('/api/reports/category-spend')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(400);
    });

    it('should return empty array when no category spend found', async () => {
      context.mockPrismaService.categorySpendProjection.findMany.mockResolvedValueOnce(
        [],
      );

      const response = await request(context.app.getHttpServer())
        .get('/api/reports/category-spend')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026, month: 12 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should validate year is a number', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/api/reports/category-spend')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 'invalid', month: 4 });

      expect(response.status).toBe(400);
    });

    it('should validate month is a number', async () => {
      const response = await request(context.app.getHttpServer())
        .get('/api/reports/category-spend')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026, month: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should validate month is in valid range (1-12)', async () => {
      let response = await request(context.app.getHttpServer())
        .get('/api/reports/category-spend')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026, month: 0 });

      expect(response.status).toBe(400);

      response = await request(context.app.getHttpServer())
        .get('/api/reports/category-spend')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026, month: 13 });

      expect(response.status).toBe(400);
    });

    it('should filter by authenticated user', async () => {
      context.mockPrismaService.categorySpendProjection.findMany.mockResolvedValueOnce(
        [],
      );

      const response = await request(context.app.getHttpServer())
        .get('/api/reports/category-spend')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026, month: 4 });

      expect(response.status).toBe(200);
      // Verify that the query used the authenticated user's ID
      const calls = context.mockPrismaService.categorySpendProjection.findMany
        .mock.calls as Array<
        [
          {
            where: {
              userId: string;
            };
          },
        ]
      >;
      const callArgs = calls[0][0];
      expect(callArgs.where.userId).toBe(TEST_USER.id);
    });

    it('should order results by total descending', async () => {
      const highSpend = {
        userId: TEST_USER.id,
        categoryId: 'category-rent',
        categoryName: 'Rent',
        year: 2026,
        month: 4,
        total: '1000.00',
      };
      const lowSpend = {
        userId: TEST_USER.id,
        categoryId: 'category-groceries',
        categoryName: 'Groceries',
        year: 2026,
        month: 4,
        total: '500.00',
      };

      context.mockPrismaService.categorySpendProjection.findMany.mockResolvedValueOnce(
        [highSpend, lowSpend],
      );

      const response = await request(context.app.getHttpServer())
        .get('/api/reports/category-spend')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ year: 2026, month: 4 });

      expect(response.status).toBe(200);
      expect(
        context.mockPrismaService.categorySpendProjection.findMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: TEST_USER.id,
          year: 2026,
          month: 4,
        },
        orderBy: { total: 'desc' },
      });
    });
  });
});
