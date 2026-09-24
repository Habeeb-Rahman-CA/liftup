'use client';

import { useEffect, useState } from 'react';
import type { HealthStatus } from '@liftup/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/health');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data: HealthStatus = await res.json();
      setHealth(data);
    } catch (err) {
      setError((err as Error).message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInitialHealth() {
      try {
        const res = await fetch('/api/v1/health');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data: HealthStatus = await res.json();
        if (isMounted) {
          setHealth(data);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message);
          setHealth(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadInitialHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Liftup Monorepo</h1>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
              >
                pnpm + Turborepo
              </Badge>
            </div>
            <p className="text-neutral-400 text-sm mt-1">
              Next.js 16 (`apps/web`) + NestJS 11 (`apps/api`) + Shared Types & Neon DB
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHealth}
              disabled={loading}
              className="border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200"
            >
              {loading ? 'Checking...' : 'Refresh Health'}
            </Button>
          </div>
        </div>

        {/* Live Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Frontend Card */}
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Web App (Next.js)</CardTitle>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  @liftup/web
                </Badge>
              </div>
              <CardDescription className="text-neutral-400">
                App Router, Tailwind CSS v4, shadcn/ui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-400">
                Port: <span className="font-mono text-neutral-200">3000</span>
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Proxy: <span className="font-mono text-neutral-200">/api → localhost:4000</span>
              </p>
            </CardContent>
          </Card>

          {/* Backend Card */}
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">API (NestJS)</CardTitle>
                {loading ? (
                  <Badge variant="outline" className="border-neutral-700 text-neutral-400">
                    Checking...
                  </Badge>
                ) : health ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">Offline</Badge>
                )}
              </div>
              <CardDescription className="text-neutral-400">
                Modular NestJS REST API (@liftup/api)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-400">
                Port: <span className="font-mono text-neutral-200">4000</span>
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Status:{' '}
                <span className="font-mono text-neutral-200">
                  {health
                    ? health.service || 'Online'
                    : error
                      ? 'Not reachable (run pnpm dev)'
                      : 'Checking...'}
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Neon DB Card */}
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Neon DB (Postgres)</CardTitle>
                {loading ? (
                  <Badge variant="outline" className="border-neutral-700 text-neutral-400">
                    Checking...
                  </Badge>
                ) : health?.database?.status === 'connected' ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  >
                    Pending URL
                  </Badge>
                )}
              </div>
              <CardDescription className="text-neutral-400">
                Prisma ORM & Connection Pooling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-400">
                Status:{' '}
                <span className="font-mono text-neutral-200">
                  {health?.database?.status ?? 'Configure apps/api/.env'}
                </span>
              </p>
              {health?.database?.latencyMs !== undefined && (
                <p className="text-xs text-neutral-400 mt-1">
                  Latency:{' '}
                  <span className="font-mono text-neutral-200">{health.database.latencyMs}ms</span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Setup Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader>
              <CardTitle className="text-lg">Connect your Neon Database</CardTitle>
              <CardDescription className="text-neutral-400">
                Add your Neon Postgres connection strings to start querying
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-neutral-300">
              <p>
                1. Open or create a database on{' '}
                <a
                  href="https://neon.tech"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
                >
                  neon.tech
                </a>
                .
              </p>
              <p>
                2. Edit{' '}
                <code className="bg-neutral-800 text-emerald-400 px-1.5 py-0.5 rounded text-xs">
                  apps/api/.env
                </code>
                :
              </p>
              <pre className="bg-neutral-950 p-3 rounded-lg text-xs font-mono text-neutral-300 border border-neutral-800">
                {`# Pooled URL for queries
DATABASE_URL="postgresql://user:pass@ep-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Direct URL for migrations
DIRECT_URL="postgresql://user:pass@ep.us-east-2.aws.neon.tech/neondb?sslmode=require"`}
              </pre>
              <p>3. Push your Prisma schema to Neon:</p>
              <pre className="bg-neutral-950 p-2.5 rounded text-xs font-mono text-neutral-300 border border-neutral-800">
                pnpm prisma:push
              </pre>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader>
              <CardTitle className="text-lg">Turborepo Commands</CardTitle>
              <CardDescription className="text-neutral-400">
                Monorepo workspace scripts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-mono text-xs text-emerald-400">pnpm dev</p>
                <p className="text-xs text-neutral-400">
                  Run web and api simultaneously with Turborepo
                </p>
              </div>
              <div className="pt-2 border-t border-neutral-800">
                <p className="font-mono text-xs text-emerald-400">pnpm dev:web</p>
                <p className="text-xs text-neutral-400">
                  Start Next.js App Router only (port 3000)
                </p>
              </div>
              <div className="pt-2 border-t border-neutral-800">
                <p className="font-mono text-xs text-emerald-400">pnpm dev:api</p>
                <p className="text-xs text-neutral-400">
                  Start NestJS API with watch mode (port 4000)
                </p>
              </div>
              <div className="pt-2 border-t border-neutral-800">
                <p className="font-mono text-xs text-emerald-400">pnpm build</p>
                <p className="text-xs text-neutral-400">
                  Build all apps and packages via Turborepo pipeline
                </p>
              </div>
              <div className="pt-2 border-t border-neutral-800">
                <p className="font-mono text-xs text-emerald-400">pnpm prisma:studio</p>
                <p className="text-xs text-neutral-400">Open Prisma Studio database browser</p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-neutral-800 pt-4">
              <span className="text-xs text-neutral-400">
                Schema:{' '}
                <code className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-300">
                  apps/api/prisma/schema.prisma
                </code>
              </span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
