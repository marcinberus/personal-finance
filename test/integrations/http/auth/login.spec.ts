import request from 'supertest';
import { AppTestContext } from '../base/app-context';
import { TEST_USER } from '../base/fixtures';

describe('POST /api/auth/login (http)', () => {
  const ctx = new AppTestContext();

  beforeAll(() => ctx.init());
  afterAll(() => ctx.close());
  beforeEach(() => ctx.prisma.reset());

  it('should log in with valid credentials and return a token', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);

    const res = await request(ctx.getHttpServer())
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'password' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).toMatchObject({ email: TEST_USER.email });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('should return 401 for an unknown email', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(null);

    await request(ctx.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })
      .expect(401);
  });

  it('should return 401 for a wrong password', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);

    await request(ctx.getHttpServer())
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'wrongpassword' })
      .expect(401);
  });

  it('should return 400 for missing fields', async () => {
    await request(ctx.getHttpServer())
      .post('/api/auth/login')
      .send({ email: TEST_USER.email })
      .expect(400);
  });
});
