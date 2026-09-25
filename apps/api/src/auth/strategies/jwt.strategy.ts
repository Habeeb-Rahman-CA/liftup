import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { UserProfile } from '@liftup/types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // In-memory cache to avoid querying PostgreSQL on every single API request
  private static userCache = new Map<
    string,
    { user: UserProfile; expiresAt: number }
  >();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'liftup-super-secret-jwt-key-change-in-production',
    });
  }

  public static invalidateUserCache(userId: string) {
    JwtStrategy.userCache.delete(userId);
  }

  async validate(payload: JwtPayload): Promise<UserProfile> {
    const cached = JwtStrategy.userCache.get(payload.sub);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        timezone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    const profile: UserProfile = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    // Cache profile for 60 seconds
    JwtStrategy.userCache.set(payload.sub, {
      user: profile,
      expiresAt: now + 60000,
    });

    return profile;
  }
}
