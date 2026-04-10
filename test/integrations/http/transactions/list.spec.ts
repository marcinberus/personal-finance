import request from 'supertest';
import { AppTestContext } from '../base/app-context';
import { TEST_CATEGORY, TEST_TRANSACTION, TEST_USER } from '../base/fixtures';

const TEST_TRANSACTION_EXPENSE = {
  id: 'transaction-expense-id',
  userId: TEST_USER.id,
  categoryId: 'category-expense-id',
  amount: '250.00',
  type: 'expense' as const,
  description: 'Groceries',
  transactionDate: new Date('2026-01-20T00:00:00.000Z'),
  createdAt: new Date(),
  category: {
    id: 'category-expense-id',
    name: 'Groceries',
    type: 'expense' as const,
  },
};

describe('GET /api/transactions (http)', () => {
  const ctx = new AppTestContext();
  let accessToken: string;

  beforeAll(async () => {
    await ctx.init();

    ctx.prisma.user.findUnique
      .mockResolvedValueOnce(TEST_USER)
      .mockResolvedValueOnce(TEST_USER);

    const res = await request(ctx.getHttpServer())
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'password' });

    accessToken = (res.body as { accessToken: string }).accessToken;
  });

  afterAll(() => ctx.close());
  beforeEach(() => ctx.prisma.reset());

  it('should return all transactions for the authenticated user', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);
    ctx.prisma.transaction.findMany.mockResolvedValue([
      TEST_TRANSACTION,
      TEST_TRANSACTION_EXPENSE,
    ]);

    const res = await request(ctx.getHttpServer())
      .get('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as { id: string }[];
    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({ id: TEST_TRANSACTION.id });
    expect(body[1]).toMatchObject({ id: TEST_TRANSACTION_EXPENSE.id });
  });

  it('should filter transactions by type', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);
    ctx.prisma.transaction.findMany.mockResolvedValue([TEST_TRANSACTION]);

    const res = await request(ctx.getHttpServer())
      .get('/api/transactions')
      .query({ type: 'income' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as { type: string }[];
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ type: 'income' });
  });

  it('should filter transactions by categoryId', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);
    ctx.prisma.transaction.findMany.mockResolvedValue([TEST_TRANSACTION]);

    const res = await request(ctx.getHttpServer())
      .get('/api/transactions')
      .query({ categoryId: TEST_CATEGORY.id })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as { categoryId: string }[];
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ categoryId: TEST_CATEGORY.id });
  });

  it('should filter transactions by date range', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);
    ctx.prisma.transaction.findMany.mockResolvedValue([TEST_TRANSACTION]);

    const res = await request(ctx.getHttpServer())
      .get('/api/transactions')
      .query({ from: '2026-01-01', to: '2026-01-31' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
  });

  it('should return an empty array when the user has no transactions', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);
    ctx.prisma.transaction.findMany.mockResolvedValue([]);

    const res = await request(ctx.getHttpServer())
      .get('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('should return 400 for an invalid type filter value', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);

    await request(ctx.getHttpServer())
      .get('/api/transactions')
      .query({ type: 'invalid-type' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('should return 401 when no token is provided', async () => {
    await request(ctx.getHttpServer()).get('/api/transactions').expect(401);
  });
});
