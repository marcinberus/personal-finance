import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User } from '../../prisma/generated/client';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { AuthCookieService } from './auth-cookie.service';

export type AuthResponse = {
  accessToken: string;
  user: { id: string; email: string };
};

type TokenPayload = {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
};

export type AuthSessionResult = AuthResponse & {
  refreshToken: string;
};

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly authCookieService: AuthCookieService,
    configService: ConfigService,
  ) {
    const refreshSecret = configService.get<string>('AUTH_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error('AUTH_REFRESH_SECRET is not configured');
    }

    this.refreshSecret = refreshSecret;
  }

  async register(dto: RegisterDto): Promise<AuthSessionResult> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create(dto.email, passwordHash);

    return this.buildAuthSession(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthSessionResult> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthSession(user.id, user.email);
  }

  async refresh(refreshToken: string): Promise<AuthSessionResult> {
    const user = await this.validateRefreshToken(refreshToken);
    return this.buildAuthSession(user.id, user.email);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  private async buildAuthSession(
    userId: string,
    email: string,
  ): Promise<AuthSessionResult> {
    const payload: TokenPayload = { sub: userId, email, type: 'access' };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret: this.refreshSecret,
          expiresIn: `${this.authCookieService.refreshTokenTtlSeconds}s`,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
      },
    };
  }

  private async validateRefreshToken(
    refreshToken: string,
  ): Promise<{ id: string; email: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    let payload: TokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      id: user.id,
      email: user.email,
    };
  }
}
