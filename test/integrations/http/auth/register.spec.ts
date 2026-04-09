import request from 'supertest';
import { AppTestContext } from '../base/app-context';
import { TEST_USER } from '../base/fixtures';

describe('POST /api/auth/register (http)', () => {
  const ctx = new AppTestContext();

  beforeAll(() => ctx.init());
  afterAll(() => ctx.close());
  beforeEach(() => ctx.prisma.reset());

  it('should register a new user and return a token', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(null);
    ctx.prisma.user.create.mockResolvedValue(TEST_USER);

    const res = await request(ctx.getHttpServer())
      .post('/api/auth/register')
      .send({ email: TEST_USER.email, password: 'password123' })
      .expect(201);

    const body = res.body as {
      accessToken: string;
      user: { id: string; email: string };
    };
    expect(body).toHaveProperty('accessToken');
    expect(body.user).toMatchObject({ email: TEST_USER.email });
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('should return 409 when the email is already in use', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(TEST_USER);

    await request(ctx.getHttpServer())
      .post('/api/auth/register')
      .send({ email: TEST_USER.email, password: 'password123' })
      .expect(409);
  });

  it('should return 400 for an invalid email', async () => {
    await request(ctx.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123' })
      .expect(400);
  });

  it('should return 400 when password is too short', async () => {
    await request(ctx.getHttpServer())
      .post('/api/auth/register')
      .send({ email: TEST_USER.email, password: 'short' })
      .expect(400);
  });

  it('should return 400 for unknown extra fields', async () => {
    await request(ctx.getHttpServer())
      .post('/api/auth/register')
      .send({ email: TEST_USER.email, password: 'password123', role: 'admin' })
      .expect(400);
  });
});
