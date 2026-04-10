import request from 'supertest';
import { AppTestContext } from '../base/app-context';
import { TEST_CATEGORY, TEST_TRANSACTION, TEST_USER } from '../base/fixtures';

describe('POST /api/transactions (http)', () => {
  const ctx = new AppTestContext();
  let accessToken: string;

  beforeAll(async () => {
    await ctx.init();

    ctx.prisma.user.findUnique
      .mockResolvedValueOnce(TEST_USER) // login: findByEmail
      .mockResolvedValueOnce(TEST_USER); // JwtStrategy.validate: findById

    const res = await request(ctx.getHttpServer())
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'password' });

    accessToken = (res.body as { accessToken: string }).accessToken;
  });

  afterAll(() => ctx.close());
  beforeEach(() => ctx.prisma.reset());

  it('should create a transaction and return it', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);
    ctx.prisma.category.findFirst.mockResolvedValue(TEST_CATEGORY);
    ctx.prisma.transaction.create.mockResolvedValue(TEST_TRANSACTION);

    const res = await request(ctx.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId: TEST_CATEGORY.id,
        amount: 1000,
        type: 'income',
        description: 'Monthly salary',
        transactionDate: '2026-01-15',
      })
      .expect(201);

    expect(res.body).toMatchObject({
      id: TEST_TRANSACTION.id,
      userId: TEST_USER.id,
      categoryId: TEST_CATEGORY.id,
      type: 'income',
    });
  });

  it('should return 404 when the category is not found', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);
    ctx.prisma.category.findFirst.mockResolvedValue(null);

    await request(ctx.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId: TEST_CATEGORY.id,
        amount: 1000,
        type: 'income',
        transactionDate: '2026-01-15',
      })
      .expect(404);
  });

  it('should return 400 when category type does not match transaction type', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);
    ctx.prisma.category.findFirst.mockResolvedValue({
      ...TEST_CATEGORY,
      type: 'expense',
    });

    await request(ctx.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId: TEST_CATEGORY.id,
        amount: 1000,
        type: 'income',
        transactionDate: '2026-01-15',
      })
      .expect(400);
  });

  it('should return 400 when amount is below the minimum', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);

    await request(ctx.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId: TEST_CATEGORY.id,
        amount: 0,
        type: 'income',
        transactionDate: '2026-01-15',
      })
      .expect(400);
  });

  it('should return 400 for an invalid type enum value', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);

    await request(ctx.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId: TEST_CATEGORY.id,
        amount: 1000,
        type: 'invalid-type',
        transactionDate: '2026-01-15',
      })
      .expect(400);
  });

  it('should return 400 when categoryId is missing', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);

    await request(ctx.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        amount: 1000,
        type: 'income',
        transactionDate: '2026-01-15',
      })
      .expect(400);
  });

  it('should return 400 when transactionDate is missing', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);

    await request(ctx.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId: TEST_CATEGORY.id,
        amount: 1000,
        type: 'income',
      })
      .expect(400);
  });

  it('should return 400 for unknown extra fields', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);

    await request(ctx.getHttpServer())
      .post('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId: TEST_CATEGORY.id,
        amount: 1000,
        type: 'income',
        transactionDate: '2026-01-15',
        extra: 'field',
      })
      .expect(400);
  });

  it('should return 401 when no token is provided', async () => {
    await request(ctx.getHttpServer())
      .post('/api/transactions')
      .send({
        categoryId: TEST_CATEGORY.id,
        amount: 1000,
        type: 'income',
        transactionDate: '2026-01-15',
      })
      .expect(401);
  });
});
