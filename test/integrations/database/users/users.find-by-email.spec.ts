import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { UsersModule } from '../../../../src/users/users.module';
import { UsersService } from '../../../../src/users/users.service';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { cleanDatabase } from '../database';

describe('UsersService.findByEmail (integration)', () => {
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

  it('returns the user when the email exists', async () => {
    await usersService.create('bob@example.com', 'hash_bob');

    const found = await usersService.findByEmail('bob@example.com');

    expect(found).not.toBeNull();
    expect(found!.email).toBe('bob@example.com');
    expect(found!.passwordHash).toBe('hash_bob');
  });

  it('returns null when no user has that email', async () => {
    const found = await usersService.findByEmail('nobody@example.com');

    expect(found).toBeNull();
  });

  it('is case-sensitive (does not match wrong case)', async () => {
    await usersService.create('carol@example.com', 'hash_carol');

    const found = await usersService.findByEmail('CAROL@EXAMPLE.COM');

    expect(found).toBeNull();
  });
});
