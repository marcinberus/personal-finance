import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

const mockUser = {
  id: 'user-id-1',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  createdAt: new Date(),
};

const mockAuthService = {
  validateUser: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('test-jwt-secret'),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);

    jest.clearAllMocks();
  });

  describe('validate', () => {
    const payload = { sub: 'user-id-1', email: 'test@example.com' };

    it('should return user object for a valid payload', async () => {
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({ id: mockUser.id, email: mockUser.email });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow('Invalid token');
    });
  });

  describe('constructor', () => {
    it('should throw when JWT_SECRET is not configured', () => {
      const configServiceWithoutSecret = { get: jest.fn().mockReturnValue(undefined) };

      expect(
        () =>
          new JwtStrategy(
            configServiceWithoutSecret as unknown as ConfigService,
            mockAuthService as unknown as AuthService,
          ),
      ).toThrow('JWT_SECRET is not configured');
    });
  });
});
