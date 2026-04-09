import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const mockAuthResponse = {
  accessToken: 'signed-jwt-token',
  user: { id: 'user-id-1', email: 'test@example.com' },
};

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
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
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    it('should call authService.login and return auth response', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAuthResponse);
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
