import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppTestContext, TEST_IDENTITY_CLIENT } from '../base/app-context';
import { TEST_USER } from '../base/fixtures';

describe('GET /api/transactions/summary (http)', () => {
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
  beforeEach(() => {
    ctx.prisma.reset();
    jest.clearAllMocks();
  });

  it('should return a summary enriched with user email from identity-service', async () => {
    TEST_IDENTITY_CLIENT.getUserById.mockResolvedValue({
      id: TEST_USER.id,
      email: TEST_USER.email,
    });

    ctx.prisma.transaction.findMany.mockResolvedValue([
      { amount: '2000.00', type: 'income' },
      { amount: '500.00', type: 'expense' },
      { amount: '300.00', type: 'expense' },
    ]);

    const res = await request(ctx.getHttpServer())
      .get('/api/transactions/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({
      userEmail: TEST_USER.email,
      totalIncome: 2000,
      totalExpenses: 800,
      balance: 1200,
    });

    expect(TEST_IDENTITY_CLIENT.getUserById).toHaveBeenCalledWith(TEST_USER.id);
  });

  it('should return 401 when no token is provided', async () => {
    await request(ctx.getHttpServer())
      .get('/api/transactions/summary')
      .expect(401);
  });
});
