import request from 'supertest';
import { AppTestContext } from '../base/app-context';
import { TEST_TRANSACTION, TEST_USER } from '../base/fixtures';

describe('DELETE /api/transactions/:id (http)', () => {
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

  it('should delete the transaction and return success', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);
    ctx.prisma.transaction.findFirst.mockResolvedValue({
      id: TEST_TRANSACTION.id,
    });
    ctx.prisma.transaction.delete.mockResolvedValue(undefined);

    const res = await request(ctx.getHttpServer())
      .delete(`/api/transactions/${TEST_TRANSACTION.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({ success: true });
  });

  it('should return 404 when the transaction is not found', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);
    ctx.prisma.transaction.findFirst.mockResolvedValue(null);

    await request(ctx.getHttpServer())
      .delete(`/api/transactions/non-existent-id`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('should return 401 when no token is provided', async () => {
    await request(ctx.getHttpServer())
      .delete(`/api/transactions/${TEST_TRANSACTION.id}`)
      .expect(401);
  });
});
