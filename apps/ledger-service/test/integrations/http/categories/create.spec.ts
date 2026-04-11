import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppTestContext } from '../base/app-context';
import { TEST_CATEGORY, TEST_USER } from '../base/fixtures';

describe('POST /api/categories (http)', () => {
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

  it('should create a category and return it', async () => {
    ctx.prisma.category.findFirst.mockResolvedValue(null);
    ctx.prisma.category.create.mockResolvedValue(TEST_CATEGORY);

    const res = await request(ctx.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Salary', type: 'income' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: TEST_CATEGORY.id,
      name: TEST_CATEGORY.name,
      type: TEST_CATEGORY.type,
      userId: TEST_USER.id,
    });
  });

  it('should return 409 when the category name already exists for the same type', async () => {
    ctx.prisma.category.findFirst.mockResolvedValue(TEST_CATEGORY);

    await request(ctx.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Salary', type: 'income' })
      .expect(409);
  });

  it('should return 400 for an invalid type enum value', async () => {
    await request(ctx.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Salary', type: 'invalid-type' })
      .expect(400);
  });

  it('should return 400 when name is missing', async () => {
    await request(ctx.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'income' })
      .expect(400);
  });

  it('should return 400 for unknown extra fields', async () => {
    await request(ctx.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Salary', type: 'income', extra: 'field' })
      .expect(400);
  });

  it('should return 401 when no token is provided', async () => {
    await request(ctx.getHttpServer())
      .post('/api/categories')
      .send({ name: 'Salary', type: 'income' })
      .expect(401);
  });
});
