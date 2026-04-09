import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { UsersModule } from '../../../../src/modules/users/users.module';
import { AuthModule } from '../../../../src/modules/auth/auth.module';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { cleanDatabase } from '../database';

describe('AuthService.register (integration)', () => {
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

  it('returns an access token and user summary (no passwordHash)', async () => {
    const result = await authService.register({
      email: 'reg@example.com',
      password: 'password123',
    });

    expect(result.accessToken).toBeDefined();
    expect(typeof result.accessToken).toBe('string');
    expect(result.user.email).toBe('reg@example.com');
    expect(result.user.id).toBeDefined();
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('persists the user in the database', async () => {
    await authService.register({
      email: 'persist@example.com',
      password: 'password123',
    });

    const row = await prisma.user.findUnique({
      where: { email: 'persist@example.com' },
    });

    expect(row).not.toBeNull();
    expect(row!.email).toBe('persist@example.com');
  });

  it('stores a bcrypt hash, not the plaintext password', async () => {
    await authService.register({
      email: 'hash@example.com',
      password: 'plaintext-pass',
    });

    const row = await prisma.user.findUnique({
      where: { email: 'hash@example.com' },
    });

    // bcrypt hashes always start with $2b$, $2a$, or $2y$
    expect(row!.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(row!.passwordHash).not.toBe('plaintext-pass');
  });

  it('issues a JWT whose sub matches the created user id', async () => {
    const result = await authService.register({
      email: 'jwt@example.com',
      password: 'password123',
    });

    const payload = jwtService.decode<{ sub: string; email: string }>(
      result.accessToken,
    );

    expect(payload.sub).toBe(result.user.id);
    expect(payload.email).toBe('jwt@example.com');
  });

  it('throws ConflictException when the email is already registered', async () => {
    await authService.register({
      email: 'dup@example.com',
      password: 'password123',
    });

    await expect(
      authService.register({
        email: 'dup@example.com',
        password: 'another123',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
