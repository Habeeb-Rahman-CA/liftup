import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import type { AuthResponse, AuthTokens, UserProfile } from '@liftup/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresInSeconds: number = 60 * 60; // 1 hour
  private readonly refreshTokenExpiresInDays: number = 30; // 30 days

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'liftup-super-secret-jwt-key-change-in-production';
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      this.logger.warn(
        `Registration rejected: email already exists (${dto.email.toLowerCase().trim()})`,
      );
      throw new ConflictException('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        name: dto.name?.trim() || null,
        timezone: dto.timezone?.trim() || 'UTC',
        role: 'USER',
      },
    });

    this.logger.log(
      `Security Event: New user registered [ID: ${user.id}] [Email: ${user.email}]`,
    );
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.mapToUserProfile(user),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      this.logger.warn(
        `Auth Failure: Login attempt with non-existent email (${dto.email.toLowerCase().trim()})`,
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      this.logger.warn(
        `Auth Failure: Invalid password for user [ID: ${user.id}] [Email: ${user.email}]`,
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(
      `Security Event: User logged in [ID: ${user.id}] [Email: ${user.email}]`,
    );
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.mapToUserProfile(user),
      tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponse> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      this.logger.warn('Auth Failure: Invalid refresh token presented');
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      this.logger.warn(
        `Auth Failure: Expired refresh token for user [ID: ${storedToken.user.id}]`,
      );
      throw new UnauthorizedException(
        'Refresh token has expired, please log in again',
      );
    }

    // Rotate refresh token
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    this.logger.log(
      `Security Event: Token rotated for user [ID: ${storedToken.user.id}]`,
    );
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    return {
      user: this.mapToUserProfile(storedToken.user),
      tokens,
    };
  }

  async logout(
    userId: string,
    refreshToken?: string,
  ): Promise<{ success: boolean }> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId, token: refreshToken },
      });
    } else {
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    this.logger.log(`Security Event: User logged out [ID: ${userId}]`);
    return { success: true };
  }

  async getMe(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return this.mapToUserProfile(user);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: 'USER' | 'ADMIN',
  ): Promise<AuthTokens> {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: `${this.jwtExpiresInSeconds}s`,
    });

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenString,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
      expiresIn: this.jwtExpiresInSeconds,
    };
  }

  private mapToUserProfile(user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    timezone: string | null;
    role: 'USER' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
  }): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      timezone: user.timezone,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
