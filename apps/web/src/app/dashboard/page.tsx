'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  ShieldCheck,
  Globe,
  Calendar,
  Dumbbell,
  LogOut,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, logout, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-500">Loading session...</p>
        </div>
      </div>
    );
  }

  const memberSinceFormatted = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <main className="flex-1 p-3.5 sm:p-8 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 pb-20 md:pb-8">
      {/* Top Banner / Welcome */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 rounded-lg bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium text-base sm:text-lg uppercase shrink-0">
            {user.name ? user.name.charAt(0) : user.email.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-medium tracking-tight text-zinc-100 truncate">
                Welcome, {user.name || user.email.split('@')[0]}
              </h1>
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] font-normal">
                {user.role}
              </Badge>
              <Badge
                variant="outline"
                className="border-zinc-800 text-zinc-400 text-[10px] font-normal"
              >
                <ShieldCheck className="h-3 w-3 mr-1 text-emerald-500" />
                Active
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full sm:w-auto border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs h-8"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* User Identity Card */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-lg">
          <CardHeader className="pb-2.5 sm:pb-3 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2 text-zinc-200">
                <User className="h-4 w-4 text-emerald-500" />
                Account Profile
              </CardTitle>
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] font-normal">
                Verified
              </Badge>
            </div>
            <CardDescription className="text-zinc-500 text-[11px] sm:text-xs">
              Personal settings and identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 sm:space-y-3 text-xs p-4 pt-0 sm:p-6 sm:pt-0">
            <div>
              <span className="text-zinc-500 block text-[11px]">Email Address</span>
              <span className="font-mono text-zinc-200 break-all">{user.email}</span>
            </div>
            <div className="pt-2 border-t border-zinc-800">
              <span className="text-zinc-500 block text-[11px]">User ID</span>
              <span className="font-mono text-[10px] text-zinc-400 break-all">{user.id}</span>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-500 flex items-center gap-1 text-[11px]">
                <Globe className="h-3 w-3 text-zinc-500" />
                Timezone
              </span>
              <span className="font-mono text-zinc-300">{user.timezone || 'UTC'}</span>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-500 flex items-center gap-1 text-[11px]">
                <Calendar className="h-3 w-3 text-zinc-500" />
                Member Since
              </span>
              <span className="text-zinc-300">{memberSinceFormatted}</span>
            </div>
          </CardContent>
        </Card>

        {/* Security & Token Info */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-lg">
          <CardHeader className="pb-2.5 sm:pb-3 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2 text-zinc-200">
                <KeyRound className="h-4 w-4 text-emerald-500" />
                Session & Security
              </CardTitle>
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] font-normal">
                Encrypted
              </Badge>
            </div>
            <CardDescription className="text-zinc-500 text-[11px] sm:text-xs">
              JWT bearer token and session validity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 sm:space-y-3 text-xs p-4 pt-0 sm:p-6 sm:pt-0">
            <div>
              <span className="text-zinc-500 block text-[11px]">Session Status</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 text-xs font-medium">Active (Protected)</span>
              </div>
            </div>
            <div className="pt-2 border-t border-zinc-800">
              <span className="text-zinc-500 block text-[11px]">Refresh Token Rotation</span>
              <span className="text-zinc-300">Enabled (30 Days)</span>
            </div>
            <div className="pt-2 border-t border-zinc-800">
              <span className="text-zinc-500 block text-[11px]">Authorization Bearer</span>
              <code className="text-[10px] text-zinc-400 font-mono bg-zinc-950 px-2 py-1 rounded block truncate mt-1 border border-zinc-800">
                Bearer {token ? `${token.slice(0, 18)}...` : 'Active'}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ready for Workout Phase Card */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-lg">
        <CardHeader className="pb-2.5 sm:pb-3 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800">
                <Dumbbell className="h-3.5 w-3.5" />
              </div>
              <CardTitle className="text-xs sm:text-sm font-medium text-zinc-200">
                Workout Tracking
              </CardTitle>
            </div>
            <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] font-normal">
              Phase 2 Coming Next
            </Badge>
          </div>
          <CardDescription className="text-zinc-500 text-[11px] sm:text-xs">
            User ownership is established. Workout schedules, sessions, and set logging are ready to
            be built.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="p-3 sm:p-3.5 rounded-md bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              1. Workout Schedules
            </span>
            <p className="text-[11px] text-zinc-500">
              Define routines (Push/Pull/Legs) mapped to days of the week.
            </p>
          </div>
          <div className="p-3 sm:p-3.5 rounded-md bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              2. Workout Sessions
            </span>
            <p className="text-[11px] text-zinc-500">
              Track active sessions: Planned, In Progress, Completed, Skipped.
            </p>
          </div>
          <div className="p-3 sm:p-3.5 rounded-md bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              3. Set & Weight Logs
            </span>
            <p className="text-[11px] text-zinc-500">
              Log Warmup vs Working sets, reps, kg weight, and notes.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
