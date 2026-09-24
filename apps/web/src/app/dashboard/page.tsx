'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { schedulesApi } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  ShieldCheck,
  Globe,
  Calendar,
  CalendarDays,
  Dumbbell,
  LogOut,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  BedDouble,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { TodayWorkoutDto } from '@liftup/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, logout, loading: authLoading } = useAuth();
  const [todayData, setTodayData] = useState<TodayWorkoutDto | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      schedulesApi
        .getTodayWorkout()
        .then(data => {
          setTodayData(data);
          setLoadingSchedule(false);
        })
        .catch(() => {
          setLoadingSchedule(false);
        });
    }
  }, [user]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium text-base sm:text-lg uppercase shrink-0">
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
            className="w-full sm:w-auto border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs h-8 rounded-xl"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* TODAY'S WORKOUT SPOTLIGHT & UPCOMING WORKOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Today's Workout Spotlight (2 cols on desktop) */}
        <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-zinc-900 to-zinc-950 border border-emerald-900/60 p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Today&apos;s Workout Spotlight
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              {todayData?.todayDateFormatted || 'Today'}
            </span>
          </div>

          {todayData?.today ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
                      {todayData.today.name}
                    </h2>
                    {todayData.today.isRestDay ? (
                      <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px] font-normal gap-1">
                        <BedDouble className="h-3 w-3" />
                        Rest &amp; Recovery
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-950 text-emerald-300 border-emerald-700 text-[10px] font-normal gap-1">
                        <Dumbbell className="h-3 w-3" />
                        {todayData.today.exercises?.length || 0} Exercises
                      </Badge>
                    )}
                  </div>
                  {todayData.today.description && (
                    <p className="text-xs text-zinc-400 mt-1 max-w-xl line-clamp-2">
                      {todayData.today.description}
                    </p>
                  )}
                </div>

                <Link href="/workouts">
                  <Button
                    size="sm"
                    className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-8 px-3 rounded-xl font-medium gap-1.5 shrink-0"
                  >
                    <span>View Schedule</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              {/* Today's Exercise Preview Chips */}
              {!todayData.today.isRestDay && (todayData.today.exercises?.length || 0) > 0 && (
                <div className="pt-2 border-t border-zinc-800/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {todayData.today.exercises!.slice(0, 4).map((ex, idx) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-900 text-zinc-400 font-mono text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-zinc-200 truncate text-[11px]">
                            {ex.exercise?.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-2">
                          {ex.targetSets} × {ex.targetRepsMin}-{ex.targetRepsMax}
                        </span>
                      </div>
                    ))}
                    {(todayData.today.exercises?.length || 0) > 4 && (
                      <div className="sm:col-span-2 text-center text-[10px] text-zinc-500 pt-0.5">
                        + {(todayData.today.exercises?.length || 0) - 4} more exercises in
                        today&apos;s routine
                      </div>
                    )}
                  </div>
                </div>
              )}

              {todayData.today.isRestDay && (
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400 flex items-center gap-2.5">
                  <BedDouble className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    Today is scheduled for active recovery. Rest, hydrate, sleep well, and prepare
                    for upcoming workouts.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No scheduled routine for today.</p>
          )}
        </div>

        {/* Upcoming Workout Card */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                Upcoming Workout
              </span>
              {todayData?.upcoming && (
                <Badge
                  variant="outline"
                  className="border-zinc-800 text-zinc-400 text-[10px] font-normal"
                >
                  {DAY_NAMES[todayData.upcoming.dayOfWeek]}
                </Badge>
              )}
            </div>

            {todayData?.upcoming ? (
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
                  {todayData.upcoming.name}
                </h3>
                <p className="text-[11px] text-zinc-400 line-clamp-2">
                  {todayData.upcoming.description || 'Next scheduled training session.'}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400">
                  <Dumbbell className="h-3 w-3" />
                  <span>{todayData.upcoming.exercises?.length || 0} exercises assigned</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No upcoming workouts found.</p>
            )}
          </div>

          {todayData?.upcoming && (
            <div className="pt-3 border-t border-zinc-800 mt-3">
              <Link href="/workouts" className="block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-xs h-7 rounded-lg justify-between px-2"
                >
                  <span>Open 7-Day Schedule</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Grid Content: Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Workout Schedules Card */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="pb-2.5 sm:pb-3 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-zinc-200">
                <CalendarDays className="h-4 w-4 text-emerald-500" />
                Workout Scheduling
              </CardTitle>
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] font-normal">
                Phase 3 Live
              </Badge>
            </div>
            <CardDescription className="text-zinc-500 text-[11px] sm:text-xs">
              7-Day split routines, exercise assignments, rest days, and target sets &amp; reps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400">
              <span className="text-zinc-200 font-medium block">Standard 7-Day Split:</span>
              Monday Chest &amp; Triceps • Tuesday Back &amp; Biceps • Wednesday Shoulders • Friday
              Legs • Saturday Core
            </div>
            <Link href="/workouts" className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-emerald-400 text-xs h-8 rounded-xl font-medium justify-between px-3"
              >
                <span>Manage 7-Day Schedule</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Exercise Library Card */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="pb-2.5 sm:pb-3 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-zinc-200">
                <Dumbbell className="h-4 w-4 text-emerald-500" />
                Exercise Library
              </CardTitle>
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] font-normal">
                21 Exercises Seeded
              </Badge>
            </div>
            <CardDescription className="text-zinc-500 text-[11px] sm:text-xs">
              Master movement catalog across Chest, Back, Shoulders, Legs, Arms, and Core.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400">
              <span className="text-zinc-200 font-medium block">Catalog Management:</span>
              CRUD movements, target sets/reps ranges, muscle category filtering, active toggles.
            </div>
            <Link href="/exercises" className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-emerald-400 text-xs h-8 rounded-xl font-medium justify-between px-3"
              >
                <span>Open Exercise Catalog</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* User Identity Card */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="pb-2.5 sm:pb-3 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-zinc-200">
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
          <CardContent className="space-y-2.5 text-xs p-4 pt-0 sm:p-5 sm:pt-0">
            <div>
              <span className="text-zinc-500 block text-[11px]">Email Address</span>
              <span className="font-mono text-zinc-200 break-all">{user.email}</span>
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
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="pb-2.5 sm:pb-3 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-zinc-200">
                <KeyRound className="h-4 w-4 text-emerald-500" />
                Session &amp; Security
              </CardTitle>
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] font-normal">
                Encrypted
              </Badge>
            </div>
            <CardDescription className="text-zinc-500 text-[11px] sm:text-xs">
              JWT bearer token and session validity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs p-4 pt-0 sm:p-5 sm:pt-0">
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
    </main>
  );
}
