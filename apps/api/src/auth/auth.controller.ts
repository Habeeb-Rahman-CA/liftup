import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { Public } from './decorators/public.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthResponse, AuthTokens, UserProfile } from '@liftup/types';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, tokens: AuthTokens) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('liftup_refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.cookie('liftup_access_token', tokens.accessToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expiresIn * 1000,
    });
  }

  private extractRefreshToken(
    req: Request,
    dtoRefreshToken?: string,
  ): string | undefined {
    if (dtoRefreshToken) return dtoRefreshToken;
    if (req.cookies?.liftup_refresh_token)
      return req.cookies.liftup_refresh_token;

    const rawCookieHeader = req.headers.cookie;
    if (rawCookieHeader) {
      const cookies = Object.fromEntries(
        rawCookieHeader.split(';').map((c) => {
          const [k, ...v] = c.trim().split('=');
          return [k, decodeURIComponent(v.join('='))];
        }),
      );
      if (cookies['liftup_refresh_token']) {
        return cookies['liftup_refresh_token'];
      }
    }
    return undefined;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @SwaggerApiResponse({
    status: 201,
    description: 'User successfully registered',
  })
  @SwaggerApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.tokens);
    return result;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @SwaggerApiResponse({
    status: 200,
    description: 'User successfully authenticated',
  })
  @SwaggerApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.tokens);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate and obtain a new JWT access token' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Tokens successfully refreshed',
  })
  @SwaggerApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto?: RefreshTokenDto,
  ): Promise<AuthResponse> {
    const tokenStr = this.extractRefreshToken(req, dto?.refreshToken);
    if (!tokenStr) {
      throw new UnauthorizedException('Refresh token is required');
    }
    const result = await this.authService.refreshToken({
      refreshToken: tokenStr,
    });
    this.setAuthCookies(res, result.tokens);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke active refresh token session' })
  @SwaggerApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refreshToken?: string },
  ): Promise<{ success: boolean }> {
    const tokenStr = this.extractRefreshToken(req, body?.refreshToken);
    const result = await this.authService.logout(userId, tokenStr);
    res.clearCookie('liftup_refresh_token', { path: '/' });
    res.clearCookie('liftup_access_token', { path: '/' });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @SwaggerApiResponse({ status: 200, description: 'Current profile retrieved' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser('id') userId: string): Promise<UserProfile> {
    return this.authService.getMe(userId);
  }
}
