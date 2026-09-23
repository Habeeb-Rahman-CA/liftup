import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Check server and Neon database health status' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
  })
  async getHealth() {
    const dbHealth = await this.prisma.isHealthy();
    return {
      status: dbHealth.ok ? 'ok' : 'degraded',
      service: 'liftup-api',
      version: 'v1',
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
