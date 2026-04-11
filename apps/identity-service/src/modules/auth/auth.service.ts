import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User } from '@app/prisma/generated/client';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

export type AuthResponse = {
  accessToken: string;
  user: { id: string; email: string };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create(dto.email, passwordHash);

    return this.buildAuthResponse(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
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

    return this.buildAuthResponse(user.id, user.email);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  private async buildAuthResponse(
    userId: string,
    email: string,
  ): Promise<AuthResponse> {
    const payload = { sub: userId, email };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: userId,
        email,
      },
    };
  }
}
