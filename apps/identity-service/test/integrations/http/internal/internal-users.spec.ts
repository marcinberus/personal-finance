import request from 'supertest';
import { AppTestContext } from '../base/app-context';
import { TEST_USER } from '../base/fixtures';

describe('GET /api/internal/users/:id (http)', () => {
  const ctx = new AppTestContext();

  beforeAll(() => ctx.init());
  afterAll(() => ctx.close());
  beforeEach(() => ctx.prisma.reset());

  it('should return user info when the secret is valid', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);

    const res = await request(ctx.getHttpServer())
      .get(`/api/internal/users/${TEST_USER.id}`)
      .set('x-internal-secret', 'test-internal-secret')
      .expect(200);

    expect(res.body).toEqual({
      id: TEST_USER.id,
      email: TEST_USER.email,
    });
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('should return 404 when the user does not exist', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(null);

    await request(ctx.getHttpServer())
      .get(`/api/internal/users/${TEST_USER.id}`)
      .set('x-internal-secret', 'test-internal-secret')
      .expect(404);
  });

  it('should return 401 when the secret header is missing', async () => {
    await request(ctx.getHttpServer())
      .get(`/api/internal/users/${TEST_USER.id}`)
      .expect(401);
  });

  it('should return 401 when the secret header is wrong', async () => {
    await request(ctx.getHttpServer())
      .get(`/api/internal/users/${TEST_USER.id}`)
      .set('x-internal-secret', 'wrong-secret')
      .expect(401);
  });
});
