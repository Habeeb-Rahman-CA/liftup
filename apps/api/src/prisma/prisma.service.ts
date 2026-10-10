import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function getPooledDatabaseUrl(): string | undefined {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return undefined;

  try {
    const url = new URL(dbUrl);
    // Ensure Neon serverless pgbouncer pooling parameters are set
    if (
      url.hostname.includes('-pooler') ||
      url.searchParams.get('pgbouncer') === 'true'
    ) {
      if (!url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
      }
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '10');
      }
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '20');
      }
      return url.toString();
    }
  } catch {
    // Fallback if URL parsing fails
  }
  return dbUrl;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = getPooledDatabaseUrl();
    super(
      url
        ? {
            datasources: {
              db: {
                url,
              },
            },
          }
        : undefined,
    );
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to Neon PostgreSQL database.');
    } catch (error) {
      this.logger.warn(
        `Could not connect to database on startup. Please verify your DATABASE_URL in .env: ${(error as Error).message}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from Neon PostgreSQL database.');
  }

  async isHealthy(): Promise<{
    ok: boolean;
    latencyMs?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
}
