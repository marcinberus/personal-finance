import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthResponse, AuthService, AuthSessionResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/common';
import type { AuthenticatedUser } from '@app/common';
import { JwtGuard } from '@app/common';
import { RegisterDto } from './dto/register.dto';
import type { Request, Response } from 'express';
import { AuthCookieService } from './auth-cookie.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(dto);
    this.setRefreshCookie(response, result);
    return this.toAuthResponse(result);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(response, result);
    return this.toAuthResponse(result);
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const refreshToken = this.extractRefreshToken(request);
    const result = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(response, result);
    return this.toAuthResponse(result);
  }

  // GET /session is intentionally equivalent to POST /refresh.
  // It exists as a GET so SPAs can call it on page load to restore the
  // current user without triggering browser pre-flight semantics.
  @Get('session')
  async session(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const refreshToken = this.extractRefreshToken(request);
    const result = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(response, result);
    return this.toAuthResponse(result);
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(
      this.authCookieService.cookieName,
      this.authCookieService.getClearCookieOptions(),
    );
  }

  //TODO: Move to one decorator
  //https://docs.nestjs.com/custom-decorators#decorator-composition
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('me')
  me(@CurrentUser() user: { id: string; email: string }): AuthenticatedUser {
    return user;
  }

  private setRefreshCookie(
    response: Response,
    result: AuthSessionResult,
  ): void {
    response.cookie(
      this.authCookieService.cookieName,
      result.refreshToken,
      this.authCookieService.getSetCookieOptions(),
    );
  }

  private toAuthResponse(result: AuthSessionResult): AuthResponse {
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  private extractRefreshToken(request: Request): string {
    const refreshToken = request.cookies?.[
      this.authCookieService.cookieName
    ] as string;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token cookie is missing');
    }

    return refreshToken;
  }
}
