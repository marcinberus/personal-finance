import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { UsersModule } from '../../../../src/modules/users/users.module';
import { UsersService } from '../../../../src/modules/users/users.service';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { cleanDatabase } from '../database';

describe('UsersService.create (integration)', () => {
  let moduleRef: TestingModule;
  let usersService: UsersService;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        UsersModule,
      ],
    }).compile();

    usersService = moduleRef.get(UsersService);
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it('persists a new user with the given email and password hash', async () => {
    const user = await usersService.create('alice@example.com', 'hash_abc');

    expect(user.id).toBeDefined();
    expect(user.email).toBe('alice@example.com');
    expect(user.passwordHash).toBe('hash_abc');
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('assigns distinct UUIDs to different users', async () => {
    const a = await usersService.create('a@example.com', 'hash_a');
    const b = await usersService.create('b@example.com', 'hash_b');

    expect(a.id).not.toBe(b.id);
  });

  it('throws when the email is already taken (unique constraint)', async () => {
    await usersService.create('dup@example.com', 'hash_1');

    await expect(
      usersService.create('dup@example.com', 'hash_2'),
    ).rejects.toThrow();
  });
});
