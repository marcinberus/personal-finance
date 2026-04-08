import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { UsersModule } from '../../../../src/users/users.module';
import { UsersService } from '../../../../src/users/users.service';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { cleanDatabase } from '../database';

describe('UsersService.findById (integration)', () => {
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

  it('returns the user when the id exists', async () => {
    const created = await usersService.create('dave@example.com', 'hash_dave');

    const found = await usersService.findById(created.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.email).toBe('dave@example.com');
  });

  it('returns null for a non-existent id', async () => {
    const found = await usersService.findById(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(found).toBeNull();
  });

  it('does not return a different user', async () => {
    const a = await usersService.create('eve@example.com', 'hash_a');
    const b = await usersService.create('frank@example.com', 'hash_b');

    const found = await usersService.findById(a.id);

    expect(found!.id).toBe(a.id);
    expect(found!.id).not.toBe(b.id);
  });
});
