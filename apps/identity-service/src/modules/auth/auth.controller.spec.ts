import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthCookieService } from './auth-cookie.service';
import type { Request, Response } from 'express';

const mockAuthSession = {
  accessToken: 'signed-access-token',
  refreshToken: 'signed-refresh-token',
  user: { id: 'user-id-1', email: 'test@example.com' },
};

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
};

const mockAuthCookieService = {
  cookieName: 'pf_refresh_token',
  getSetCookieOptions: jest.fn().mockReturnValue({
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 604800000,
  }),
  getClearCookieOptions: jest.fn().mockReturnValue({
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/api/auth',
  }),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthCookieService, useValue: mockAuthCookieService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register and return auth response', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const cookieMock = jest.fn();
      const response = {
        cookie: cookieMock,
      } as unknown as Response;

      mockAuthService.register.mockResolvedValue(mockAuthSession);

      const result = await controller.register(dto, response);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(cookieMock).toHaveBeenCalledWith(
        'pf_refresh_token',
        'signed-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({
        accessToken: 'signed-access-token',
        user: mockAuthSession.user,
      });
    });
  });

  describe('login', () => {
    it('should call authService.login and return auth response', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const cookieMock = jest.fn();
      const response = {
        cookie: cookieMock,
      } as unknown as Response;

      mockAuthService.login.mockResolvedValue(mockAuthSession);

      const result = await controller.login(dto, response);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(cookieMock).toHaveBeenCalledWith(
        'pf_refresh_token',
        'signed-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({
        accessToken: 'signed-access-token',
        user: mockAuthSession.user,
      });
    });
  });

  describe('refresh', () => {
    it('should read refresh cookie and return auth response', async () => {
      const request = {
        cookies: {
          pf_refresh_token: 'refresh-token',
        },
      } as unknown as Request;
      const cookieMock = jest.fn();
      const response = {
        cookie: cookieMock,
      } as unknown as Response;
      mockAuthService.refresh.mockResolvedValue(mockAuthSession);

      const result = await controller.refresh(request, response);

      expect(mockAuthService.refresh).toHaveBeenCalledWith('refresh-token');
      expect(cookieMock).toHaveBeenCalledWith(
        'pf_refresh_token',
        'signed-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({
        accessToken: 'signed-access-token',
        user: mockAuthSession.user,
      });
    });
  });

  describe('session', () => {
    it('should return current session from refresh cookie', async () => {
      const request = {
        cookies: {
          pf_refresh_token: 'refresh-token',
        },
      } as unknown as Request;
      const cookieMock = jest.fn();
      const response = {
        cookie: cookieMock,
      } as unknown as Response;
      mockAuthService.refresh.mockResolvedValue(mockAuthSession);

      const result = await controller.session(request, response);

      expect(mockAuthService.refresh).toHaveBeenCalledWith('refresh-token');
      expect(result).toEqual({
        accessToken: 'signed-access-token',
        user: mockAuthSession.user,
      });
    });
  });

  describe('logout', () => {
    it('should clear refresh cookie', () => {
      const clearCookieMock = jest.fn();
      const response = {
        clearCookie: clearCookieMock,
      } as unknown as Response;

      controller.logout(response);

      expect(clearCookieMock).toHaveBeenCalledWith(
        'pf_refresh_token',
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe('me', () => {
    it('should return the current user from JWT context', () => {
      const currentUser = { id: 'user-id-1', email: 'test@example.com' };

      const result = controller.me(currentUser);

      expect(result).toEqual(currentUser);
    });
  });
});
