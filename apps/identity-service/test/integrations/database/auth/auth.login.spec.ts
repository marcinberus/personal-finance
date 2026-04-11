import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule, PrismaService } from '@app/prisma';
import { UsersModule } from '../../../../src/modules/users/users.module';
import { AuthModule } from '../../../../src/modules/auth/auth.module';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { cleanDatabase } from '../database';

describe('AuthService.login (integration)', () => {
  let moduleRef: TestingModule;
  let authService: AuthService;
  let jwtService: JwtService;
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
    jwtService = moduleRef.get(JwtService);
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it('returns an access token and user summary for valid credentials', async () => {
    await authService.register({
      email: 'login@example.com',
      password: 'correctpassword',
    });

    const result = await authService.login({
      email: 'login@example.com',
      password: 'correctpassword',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe('login@example.com');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('issues a valid JWT signed with the configured secret', async () => {
    await authService.register({
      email: 'signed@example.com',
      password: 'password123',
    });

    const result = await authService.login({
      email: 'signed@example.com',
      password: 'password123',
    });

    // verifyAsync will throw if signature is invalid
    await expect(
      jwtService.verifyAsync(result.accessToken),
    ).resolves.toBeDefined();
  });

  it('throws UnauthorizedException for a wrong password', async () => {
    await authService.register({
      email: 'wrong-pw@example.com',
      password: 'correct-password',
    });

    await expect(
      authService.login({
        email: 'wrong-pw@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException for an unknown email', async () => {
    await expect(
      authService.login({
        email: 'ghost@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
