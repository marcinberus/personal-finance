import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { AuthCookieService } from './auth-cookie.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as { hash: jest.Mock; compare: jest.Mock };

const mockUser = {
  id: 'user-id-1',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  createdAt: new Date(),
};

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'AUTH_REFRESH_SECRET') {
      return 'test-refresh-secret';
    }

    return undefined;
  }),
};

const mockAuthCookieService = {
  refreshTokenTtlSeconds: 604800,
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuthCookieService, useValue: mockAuthCookieService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    mockJwtService.signAsync
      .mockResolvedValueOnce('signed-access-token')
      .mockResolvedValueOnce('signed-refresh-token');
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: mockUser.id,
      email: mockUser.email,
      type: 'refresh',
    });
  });

  describe('register', () => {
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user and return auth response', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      bcrypt.hash.mockResolvedValue('hashed-password');

      const result = await service.register(dto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith(
        dto.email,
        'hashed-password',
      );
      expect(result).toEqual({
        accessToken: 'signed-access-token',
        refreshToken: 'signed-refresh-token',
        user: { id: mockUser.id, email: mockUser.email },
      });
    });

    it('should throw ConflictException if email is already in use', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      await expect(service.register(dto)).rejects.toThrow(
        'Email is already in use',
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return auth response for valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.login(dto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        dto.password,
        mockUser.passwordHash,
      );
      expect(result).toEqual({
        accessToken: 'signed-access-token',
        refreshToken: 'signed-refresh-token',
        user: { id: mockUser.id, email: mockUser.email },
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('validateUser', () => {
    it('should return the user found by id', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser.id);

      expect(mockUsersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      const result = await service.validateUser('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('refresh', () => {
    it('should issue a new auth session for a valid refresh token', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.refresh('refresh-token');

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('refresh-token', {
        secret: 'test-refresh-secret',
      });
      expect(result).toEqual({
        accessToken: 'signed-access-token',
        refreshToken: 'signed-refresh-token',
        user: { id: mockUser.id, email: mockUser.email },
      });
    });

    it('should reject when refresh token verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValueOnce(new Error('invalid'));

      await expect(service.refresh('bad-token')).rejects.toMatchObject({
        message: 'Invalid refresh token',
      });
    });

    it('should reject refresh tokens with non-refresh payload type', async () => {
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        sub: mockUser.id,
        email: mockUser.email,
        type: 'access',
      });

      await expect(service.refresh('wrong-type')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject refresh when user no longer exists', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refresh('refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
