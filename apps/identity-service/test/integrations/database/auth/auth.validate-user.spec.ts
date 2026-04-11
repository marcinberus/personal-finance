import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule, PrismaService } from '@app/prisma';
import { UsersModule } from '../../../../src/modules/users/users.module';
import { AuthModule } from '../../../../src/modules/auth/auth.module';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { cleanDatabase } from '../database';

describe('AuthService.validateUser (integration)', () => {
  let moduleRef: TestingModule;
  let authService: AuthService;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        UsersModule,
        AuthModule,
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it('returns the user record for a valid id', async () => {
    const registered = await authService.register({
      email: 'validate@example.com',
      password: 'password123',
    });

    const user = await authService.validateUser(registered.user.id);

    expect(user).not.toBeNull();
    expect(user!.id).toBe(registered.user.id);
    expect(user!.email).toBe('validate@example.com');
  });

  it('returns null for a non-existent user id', async () => {
    const user = await authService.validateUser(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(user).toBeNull();
  });
});
