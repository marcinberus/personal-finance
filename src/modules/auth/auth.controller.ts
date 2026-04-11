import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthResponse, AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as currentUserDecorator from 'src/common/decorators/current-user.decorator';
import { JwtGuard } from './jwt.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return await this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return await this.authService.login(dto);
  }

  //TODO: Move to one decorator
  //https://docs.nestjs.com/custom-decorators#decorator-composition
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('me')
  me(
    @currentUserDecorator.CurrentUser() user: { id: string; email: string },
  ): currentUserDecorator.AuthenticatedUser {
    return user;
  }
}
