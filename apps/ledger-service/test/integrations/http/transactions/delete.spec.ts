import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppTestContext } from '../base/app-context';
import { TEST_TRANSACTION, TEST_USER } from '../base/fixtures';

describe('DELETE /api/transactions/:id (http)', () => {
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

  it('should delete the transaction and return success', async () => {
    ctx.prisma.transaction.findFirst.mockResolvedValue(TEST_TRANSACTION);
    ctx.prisma.transaction.delete.mockResolvedValue(undefined);

    const res = await request(ctx.getHttpServer())
      .delete(`/api/transactions/${TEST_TRANSACTION.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({ success: true });
  });

  it('should return 404 when the transaction is not found', async () => {
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
