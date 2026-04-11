import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppTestContext } from '../base/app-context';
import { TEST_CATEGORY, TEST_USER } from '../base/fixtures';

const TEST_CATEGORY_EXPENSE = {
  id: 'category-expense-id',
  userId: TEST_USER.id,
  name: 'Groceries',
  type: 'expense' as const,
  createdAt: new Date(),
};

describe('GET /api/categories (http)', () => {
  const ctx = new AppTestContext();
  let accessToken: string;

  beforeAll(async () => {
    await ctx.init();

    accessToken = jwt.sign(
      { sub: TEST_USER.id, email: TEST_USER.email },
      'test-http-secret',
    );
  });

  afterAll(() => ctx.close());
  beforeEach(() => ctx.prisma.reset());

  it('should return all categories for the authenticated user', async () => {
    ctx.prisma.category.findMany.mockResolvedValue([
      TEST_CATEGORY,
      TEST_CATEGORY_EXPENSE,
    ]);

    const res = await request(ctx.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as { id: string }[];
    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({ id: TEST_CATEGORY.id });
    expect(body[1]).toMatchObject({ id: TEST_CATEGORY_EXPENSE.id });
  });

  it('should filter categories by type', async () => {
    ctx.prisma.category.findMany.mockResolvedValue([TEST_CATEGORY]);

    const res = await request(ctx.getHttpServer())
      .get('/api/categories')
      .query({ type: 'income' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as { type: string }[];
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ type: 'income' });
  });

  it('should return an empty array when the user has no categories', async () => {
    ctx.prisma.category.findMany.mockResolvedValue([]);

    const res = await request(ctx.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('should return 400 for an invalid type filter value', async () => {
    await request(ctx.getHttpServer())
      .get('/api/categories')
      .query({ type: 'invalid-type' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('should return 401 when no token is provided', async () => {
    await request(ctx.getHttpServer()).get('/api/categories').expect(401);
  });
});
