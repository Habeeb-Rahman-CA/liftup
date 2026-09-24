'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useActiveWorkout } from '@/context/active-workout-context';
import { schedulesApi, sessionsApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkipWorkoutModal } from '@/components/workouts/skip-workout-modal';
import { LogRestModal } from '@/components/workouts/log-rest-modal';
import {
  Dumbbell,
  CheckCircle2,
  ArrowRight,
  BedDouble,
  Clock,
  Play,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type { TodayWorkoutDto } from '@liftup/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeSession, startWorkout } = useActiveWorkout();
  const [todayData, setTodayData] = useState<TodayWorkoutDto | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [restModalOpen, setRestModalOpen] = useState(false);

  const refreshTodayData = async () => {
    try {
      const data = await schedulesApi.getTodayWorkout();
      setTodayData(data);
    } catch (err) {
      console.error('Failed to reload today workout:', err);
    }
  };

  const handleSkipToday = async (data: {
    skipReason: string;
    note?: string;
    workoutDayId?: string;
  }) => {
    await sessionsApi.skip({
      workoutDayId: data.workoutDayId || todayData?.today?.id,
      skipReason: data.skipReason,
      note: data.note,
    });
    await refreshTodayData();
  };

  const handleLogRestToday = async (data: { note?: string; workoutDayId?: string }) => {
    await sessionsApi.logRest({
      workoutDayId: data.workoutDayId || todayData?.today?.id,
      note: data.note,
    });
    await refreshTodayData();
  };

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

  // Calculate completed workout stats if workout finished today
  const completedStats = React.useMemo(() => {
    if (!todayData?.completedToday) return null;
    let volume = 0;
    let totalCompletedSets = 0;

    todayData.completedToday.exerciseLogs?.forEach(log => {
      log.setLogs?.forEach(set => {
        if (set.completed) {
          totalCompletedSets++;
          const w = Number(set.weight) || 0;
          const r = Number(set.reps) || 0;
          volume += w * r;
        }
      });
    });

    return {
      volume: Math.round(volume * 10) / 10,
      completedSetsCount: totalCompletedSets,
      durationMinutes: todayData.completedToday.durationMinutes || 1,
      exerciseCount: todayData.completedToday.exerciseLogs?.length || 0,
    };
  }, [todayData?.completedToday]);

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

  return (
    <main className="flex-1 p-3.5 sm:p-8 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 pb-32 sm:pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">Dashboard</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Overview of your daily training and workouts.
          </p>
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
                {todayData?.completedToday
                  ? todayData.completedToday.status === 'SKIPPED'
                    ? "Today's Status: Skipped"
                    : todayData.completedToday.status === 'REST'
                      ? "Today's Status: Rest Day"
                      : "Today's Completed Workout"
                  : "Today's Workout Spotlight"}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              {todayData?.todayDateFormatted || 'Today'}
            </span>
          </div>

          {todayData?.completedToday ? (
            todayData.completedToday.status === 'SKIPPED' ? (
              /* SKIPPED WORKOUT VIEW */
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-400 mt-0.5">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
                          {todayData.completedToday.name || "Today's Workout"}
                        </h2>
                        <Badge className="bg-amber-950 text-amber-300 border-amber-800 text-[10px] font-bold">
                          Skipped Today
                        </Badge>
                      </div>
                      {todayData.completedToday.skipReason && (
                        <p className="text-xs font-mono text-amber-400 mt-1 font-semibold">
                          Reason: {todayData.completedToday.skipReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href="/history">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 text-xs h-8 px-2.5 rounded-xl font-medium gap-1"
                      >
                        <span>History</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {todayData.completedToday.note && (
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-start gap-2 text-xs text-zinc-300">
                    <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold text-zinc-200">Note:</strong>{' '}
                      {todayData.completedToday.note}
                    </span>
                  </div>
                )}
              </div>
            ) : todayData.completedToday.status === 'REST' ? (
              /* REST DAY VIEW */
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-950/80 border border-purple-800/80 text-purple-400 mt-0.5">
                      <BedDouble className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
                          {todayData.completedToday.name || 'Rest Day'}
                        </h2>
                        <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[10px] font-bold">
                          Rest Day Logged
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Recovery logged for today. Rest well!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href="/history">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 text-xs h-8 px-2.5 rounded-xl font-medium gap-1"
                      >
                        <span>History</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {todayData.completedToday.note && (
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-start gap-2 text-xs text-zinc-300">
                    <FileText className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold text-zinc-200">Recovery:</strong>{' '}
                      {todayData.completedToday.note}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* COMPLETED WORKOUT DETAILED VIEW */
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
                        {todayData.completedToday.name || "Today's Workout"}
                      </h2>
                      <Badge className="bg-emerald-950 text-emerald-300 border-emerald-700 text-[10px] font-medium gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed Today
                      </Badge>
                    </div>
                    {todayData.completedToday.note && (
                      <p className="text-xs text-zinc-400 mt-1 max-w-xl italic">
                        &ldquo;{todayData.completedToday.note}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Metric Quick Stats Strip */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-800/80 text-center">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-zinc-500 font-medium uppercase font-mono">
                      Duration
                    </p>
                    <p className="text-xs sm:text-sm font-mono font-bold text-zinc-100">
                      {completedStats?.durationMinutes} mins
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-zinc-500 font-medium uppercase font-mono">
                      Volume Lifted
                    </p>
                    <p className="text-xs sm:text-sm font-mono font-bold text-emerald-300">
                      {completedStats?.volume.toLocaleString()} kg
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-zinc-500 font-medium uppercase font-mono">
                      Sets Done
                    </p>
                    <p className="text-xs sm:text-sm font-mono font-bold text-zinc-100">
                      {completedStats?.completedSetsCount} sets
                    </p>
                  </div>
                </div>

                {/* Details of What Was Done (Exercise & Sets Breakdown) */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                    What You Accomplished Today (
                    {todayData.completedToday.exerciseLogs?.length || 0} Exercises)
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {todayData.completedToday.exerciseLogs?.map((log, idx) => {
                      const completedSets = log.setLogs?.filter(s => s.completed) || [];
                      return (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-semibold text-xs text-zinc-100 truncate">
                              {idx + 1}. {log.exercise?.name || 'Exercise'}
                            </span>
                            <span className="text-[9px] uppercase font-mono text-zinc-500 shrink-0">
                              {log.exercise?.category}
                            </span>
                          </div>

                          {/* Set breakdown chips */}
                          <div className="flex flex-wrap gap-1">
                            {completedSets.length === 0 ? (
                              <span className="text-[10px] text-zinc-500 italic">
                                No sets logged
                              </span>
                            ) : (
                              completedSets.map((s, sIdx) => (
                                <span
                                  key={s.id}
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                    s.type === 'WARMUP'
                                      ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                                      : 'bg-zinc-900 text-emerald-300 border-zinc-800'
                                  }`}
                                >
                                  {s.type === 'WARMUP' ? 'W: ' : `${sIdx + 1}: `}
                                  {s.weight !== null && s.weight !== undefined
                                    ? `${s.weight}kg × `
                                    : ''}
                                  {s.reps || 0}r
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          ) : todayData?.today ? (
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

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {!todayData.today.isRestDay && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSkipModalOpen(true)}
                        className="border-amber-900/60 bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 text-xs h-8 px-2.5 rounded-xl font-medium gap-1"
                        title="Skip Today's Workout"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Skip</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRestModalOpen(true)}
                        className="border-purple-900/60 bg-purple-950/30 hover:bg-purple-900/50 text-purple-300 text-xs h-8 px-2.5 rounded-xl font-medium gap-1"
                        title="Log Today as Rest Day"
                      >
                        <BedDouble className="h-3.5 w-3.5" />
                        <span>Rest</span>
                      </Button>
                    </>
                  )}

                  {!todayData.today.isRestDay &&
                    (todayData.today.exercises?.length || 0) > 0 &&
                    (activeSession ? (
                      <Link href="/workouts/active">
                        <Button
                          size="sm"
                          className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-8 px-3 rounded-xl font-medium gap-1.5 shadow-md"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Resume Workout</span>
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() =>
                          startWorkout({
                            workoutDayId: todayData.today!.id,
                            name: todayData.today!.name,
                          })
                        }
                        className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-8 px-3 rounded-xl font-medium gap-1.5 shadow-md"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Start Workout</span>
                      </Button>
                    ))}

                  <Link href="/workouts">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 text-xs h-8 px-2.5 rounded-xl font-medium gap-1"
                      title="View Schedule"
                    >
                      <span className="hidden sm:inline">Schedule</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
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

      {/* Skip Workout Modal */}
      <SkipWorkoutModal
        isOpen={skipModalOpen}
        workoutTitle={todayData?.today?.name || 'Workout Session'}
        workoutDayId={todayData?.today?.id}
        onClose={() => setSkipModalOpen(false)}
        onSkip={handleSkipToday}
      />

      {/* Log Rest Day Modal */}
      <LogRestModal
        isOpen={restModalOpen}
        dayTitle={todayData?.today?.name || 'Rest Day'}
        workoutDayId={todayData?.today?.id}
        onClose={() => setRestModalOpen(false)}
        onLogRest={handleLogRestToday}
      />
    </main>
  );
}
