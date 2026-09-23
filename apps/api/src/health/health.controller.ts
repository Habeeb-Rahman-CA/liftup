import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    const dbHealth = await this.prisma.isHealthy();
    return {
      status: 'ok',
      service: 'liftup-api',
      timestamp: new Date().toISOString(),
      database: {
        provider: 'Neon (PostgreSQL)',
        status: dbHealth.ok ? 'connected' : 'disconnected',
        latencyMs: dbHealth.latencyMs,
        error: dbHealth.error,
      },
    };
  }
}

