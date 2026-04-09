import request from 'supertest';
import { AppTestContext } from '../base/app-context';
import { TEST_USER } from '../base/fixtures';

describe('GET /api/auth/me (http)', () => {
  const ctx = new AppTestContext();
  let accessToken: string;

  beforeAll(async () => {
    await ctx.init();

    // Obtain a valid token once for the whole suite
    ctx.prisma.user.findUnique
      .mockResolvedValueOnce(TEST_USER) // login: findByEmail
      .mockResolvedValueOnce(TEST_USER); // JwtStrategy.validate: findById

    const res = await request(ctx.getHttpServer())
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'password' });

    accessToken = res.body.accessToken;
  });

  afterAll(() => ctx.close());
  beforeEach(() => ctx.prisma.reset());

  it('should return the current user when authenticated', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);

    const res = await request(ctx.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      id: TEST_USER.id,
      email: TEST_USER.email,
    });
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('should return 401 when no token is provided', async () => {
    await request(ctx.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('should return 401 for an invalid token', async () => {
    await request(ctx.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);
  });
});
