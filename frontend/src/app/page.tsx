"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HealthData {
  status: string;
  service: string;
  timestamp: string;
  database: {
    provider: string;
    status: "connected" | "disconnected";
    latencyMs?: number;
    error?: string;
  };
}

export default function Home() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data: HealthData = await res.json();
      setHealth(data);
    } catch (err) {
      setError((err as Error).message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Liftup Stack</h1>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                Ready
              </Badge>
            </div>
            <p className="text-neutral-400 text-sm mt-1">
              Next.js 16 + shadcn/ui + NestJS + Neon DB (PostgreSQL)
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
              {loading ? "Checking..." : "Refresh Health"}
            </Button>
          </div>
        </div>

        {/* Live Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Frontend Card */}
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Next.js Frontend</CardTitle>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Online
                </Badge>
              </div>
              <CardDescription className="text-neutral-400">
                App Router, Tailwind CSS, shadcn/ui
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
                <CardTitle className="text-base font-semibold">NestJS Backend</CardTitle>
                {loading ? (
                  <Badge variant="outline" className="border-neutral-700 text-neutral-400">Checking...</Badge>
                ) : health ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">Offline</Badge>
                )}
              </div>
              <CardDescription className="text-neutral-400">
                Modular NestJS REST API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-400">
                Port: <span className="font-mono text-neutral-200">4000</span>
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Status:{" "}
                <span className="font-mono text-neutral-200">
                  {health ? health.service : error ? "Not reachable (run npm run start:backend)" : "Checking..."}
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
                  <Badge variant="outline" className="border-neutral-700 text-neutral-400">Checking...</Badge>
                ) : health?.database?.status === "connected" ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
                Status:{" "}
                <span className="font-mono text-neutral-200">
                  {health?.database?.status ?? "Configure backend/.env"}
                </span>
              </p>
              {health?.database?.latencyMs !== undefined && (
                <p className="text-xs text-neutral-400 mt-1">
                  Latency: <span className="font-mono text-neutral-200">{health.database.latencyMs}ms</span>
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
                1. Open or create a database on{" "}
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
              <p>2. Edit <code className="bg-neutral-800 text-emerald-400 px-1.5 py-0.5 rounded text-xs">backend/.env</code>:</p>
              <pre className="bg-neutral-950 p-3 rounded-lg text-xs font-mono text-neutral-300 overflow-x-auto border border-neutral-800">
{`# Pooled URL for queries
DATABASE_URL="postgresql://user:pass@ep-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Direct URL for migrations
DIRECT_URL="postgresql://user:pass@ep.us-east-2.aws.neon.tech/neondb?sslmode=require"`}
              </pre>
              <p>3. Push your Prisma schema to Neon:</p>
              <pre className="bg-neutral-950 p-2.5 rounded text-xs font-mono text-neutral-300 border border-neutral-800">
npm run prisma:push --workspace=backend
              </pre>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader>
              <CardTitle className="text-lg">Useful Commands</CardTitle>
              <CardDescription className="text-neutral-400">
                Monorepo workspace scripts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-mono text-xs text-emerald-400">npm run dev</p>
                <p className="text-xs text-neutral-400">Run both frontend and backend concurrently</p>
              </div>
              <div className="pt-2 border-t border-neutral-800">
                <p className="font-mono text-xs text-emerald-400">npm run dev:frontend</p>
                <p className="text-xs text-neutral-400">Start Next.js App Router (port 3000)</p>
              </div>
              <div className="pt-2 border-t border-neutral-800">
                <p className="font-mono text-xs text-emerald-400">npm run dev:backend</p>
                <p className="text-xs text-neutral-400">Start NestJS API with hot reload (port 4000)</p>
              </div>
              <div className="pt-2 border-t border-neutral-800">
                <p className="font-mono text-xs text-emerald-400">npm run prisma:studio --workspace=backend</p>
                <p className="text-xs text-neutral-400">Open Prisma Studio to inspect database records</p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-neutral-800 pt-4">
              <span className="text-xs text-neutral-400">
                Schema: <code className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-300">backend/prisma/schema.prisma</code>
              </span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
