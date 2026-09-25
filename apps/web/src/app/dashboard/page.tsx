'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useActiveWorkout } from '@/context/active-workout-context';
import { schedulesApi, sessionsApi, progressionApi, mealsApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkipWorkoutModal } from '@/components/workouts/skip-workout-modal';
import { LogRestModal } from '@/components/workouts/log-rest-modal';
import {
  Dumbbell,
  CheckCircle2,
  Circle,
  ArrowRight,
  BedDouble,
  Clock,
  Play,
  AlertCircle,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  Check,
  Award,
} from 'lucide-react';
import type { TodayWorkoutDto, ProgressOverviewDto, TodayMealsResponseDto } from '@liftup/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeSession, startWorkout } = useActiveWorkout();
  const [todayData, setTodayData] = useState<TodayWorkoutDto | null>(null);
  const [progressionOverview, setProgressionOverview] = useState<ProgressOverviewDto | null>(null);
  const [todayMealsData, setTodayMealsData] = useState<TodayMealsResponseDto | null>(null);
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [restModalOpen, setRestModalOpen] = useState(false);

  const refreshTodayData = async () => {
    try {
      const [data, progressData, mealsData] = await Promise.all([
        schedulesApi.getTodayWorkout(),
        progressionApi.getOverview().catch(() => null),
        mealsApi.getToday().catch(() => null),
      ]);
      setTodayData(data);
      if (progressData) setProgressionOverview(progressData);
      if (mealsData) setTodayMealsData(mealsData);
    } catch (err) {
      console.error('Failed to reload today workout/meals:', err);
    }
  };

  const handleToggleMeal = async (mealLogId: string) => {
    try {
      const res = await mealsApi.toggleMeal(mealLogId);
      setTodayMealsData(res);
    } catch (err) {
      console.error('Failed to toggle meal:', err);
    }
  };

  const handleToggleItem = async (itemLogId: string) => {
    try {
      const res = await mealsApi.toggleItem(itemLogId);
      setTodayMealsData(res);
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  const toggleMealExpand = (mealId: string) => {
    setExpandedMeals(prev => ({
      ...prev,
      [mealId]: !prev[mealId],
    }));
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
      Promise.all([
        schedulesApi.getTodayWorkout().catch(() => null),
        progressionApi.getOverview().catch(() => null),
        mealsApi.getToday().catch(() => null),
      ])
        .then(([today, progress, meals]) => {
          if (today) setTodayData(today);
          if (progress) setProgressionOverview(progress);
          if (meals) setTodayMealsData(meals);
        })
        .finally(() => {
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

  if (authLoading || (loadingSchedule && !todayData) || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[65vh] p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-xs font-mono text-zinc-400">Loading dashboard...</p>
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
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-emerald-400 truncate">
                {todayData?.completedToday
                  ? todayData.completedToday.status === 'SKIPPED'
                    ? "Today's Status: Skipped"
                    : todayData.completedToday.status === 'REST'
                      ? "Today's Status: Rest Day"
                      : "Today's Completed Workout"
                  : "Today's Workout Spotlight"}
              </span>
            </div>
            <span className="text-[9px] sm:text-[11px] text-zinc-400 font-mono shrink-0 whitespace-nowrap">
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
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h2 className="text-base sm:text-xl font-bold text-zinc-100">
                        {todayData.completedToday.name || "Today's Workout"}
                      </h2>
                      <Badge className="bg-emerald-950 text-emerald-300 border-emerald-700 text-[9px] sm:text-[10px] font-medium gap-1 py-0.5 px-1.5 shrink-0">
                        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
              <Link
                href="/workouts"
                className="group flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <span className="font-medium">Open 7-Day Schedule</span>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-800/80 transition-colors"
                  title="Open 7-Day Schedule"
                  aria-label="Open 7-Day Schedule"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* TODAY'S NUTRITION & MEALS CHECKLIST (EXPANDABLE - DEFAULT CLOSED) */}
      {todayMealsData && todayMealsData.todayLog && (
        <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-4 sm:p-5 space-y-3.5">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
                <UtensilsCrossed className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-zinc-100 flex items-center gap-2">
                  <span>Today&apos;s Nutrition &amp; Meals</span>
                  {todayMealsData.summary.totalMeals > 0 &&
                    todayMealsData.summary.completedMeals === todayMealsData.summary.totalMeals && (
                      <Badge className="bg-emerald-950 text-emerald-300 border-emerald-700 text-[9px] font-bold gap-1 py-0.5 px-1.5">
                        <Award className="h-2.5 w-2.5" />
                        100% Target Reached
                      </Badge>
                    )}
                </h3>
                <span className="text-[10px] font-mono text-zinc-400">
                  {todayMealsData.todayLog.dateFormatted || 'Today'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {todayMealsData.summary.completionRate}%
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block">
                  {todayMealsData.summary.completedMeals}/{todayMealsData.summary.totalMeals} Meals
                </span>
              </div>
              <Link
                href="/meals"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-800/80 transition-colors"
                title="Manage Meal Plan"
                aria-label="Manage Meal Plan"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${todayMealsData.summary.completionRate || 0}%` }}
              />
            </div>
            <div className="flex sm:hidden justify-between text-[10px] font-mono text-zinc-400 pt-0.5">
              <span>Progress: {todayMealsData.summary.completionRate}%</span>
              <span>
                {todayMealsData.summary.completedMeals}/{todayMealsData.summary.totalMeals} Meals
                Done
              </span>
            </div>
          </div>

          {/* Today's Meals Cards (Default Closed/Collapsed) */}
          <div className="space-y-2 pt-1">
            {todayMealsData.todayLog.mealLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-2">
                No meals scheduled for today. Set up a meal plan to track daily nutrition.
              </p>
            ) : (
              todayMealsData.todayLog.mealLogs.map(meal => {
                const isExpanded = !!expandedMeals[meal.id];
                const completedCount = meal.itemLogs.filter(i => i.completed).length;
                const totalItems = meal.itemLogs.length;

                return (
                  <div
                    key={meal.id}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      meal.completed
                        ? 'bg-zinc-950/90 border-emerald-900/60'
                        : 'bg-zinc-950/70 border-zinc-800/80'
                    }`}
                  >
                    {/* Collapsible Card Header */}
                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleMeal(meal.id)}
                          className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-colors shrink-0 ${
                            meal.completed
                              ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                          }`}
                          title={
                            meal.completed ? 'Mark as incomplete' : 'Mark entire meal as completed'
                          }
                        >
                          {meal.completed ? (
                            <CheckCircle2 className="h-4 w-4 fill-emerald-950" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <div
                          className="min-w-0 cursor-pointer select-none"
                          onClick={() => toggleMealExpand(meal.id)}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-xs sm:text-sm font-bold truncate ${
                                meal.completed ? 'text-emerald-200 line-through' : 'text-zinc-100'
                              }`}
                            >
                              {meal.name}
                            </h4>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {completedCount}/{totalItems} items
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleMealExpand(meal.id)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-colors"
                          title={isExpanded ? 'Hide items' : 'View food items'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Food Items Checklist (Only shown when expanded) */}
                    {isExpanded && (
                      <div className="px-3 sm:px-3.5 pb-3 pt-1 border-t border-zinc-850/80 space-y-1.5 bg-zinc-900/40">
                        <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold mb-1">
                          Food Items ({totalItems})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {meal.itemLogs.map(item => (
                            <div
                              key={item.id}
                              onClick={() => handleToggleItem(item.id)}
                              className={`p-2 rounded-lg border cursor-pointer select-none transition-all flex items-center justify-between gap-2 ${
                                item.completed
                                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                                  : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-200 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`flex h-4 w-4 items-center justify-center rounded border shrink-0 ${
                                    item.completed
                                      ? 'bg-emerald-900 border-emerald-600 text-emerald-100'
                                      : 'bg-zinc-900 border-zinc-700 text-transparent'
                                  }`}
                                >
                                  <Check className="h-2.5 w-2.5" />
                                </div>
                                <span
                                  className={`text-[11px] font-medium truncate ${
                                    item.completed ? 'line-through text-zinc-400' : 'text-zinc-200'
                                  }`}
                                >
                                  {item.name}
                                </span>
                              </div>

                              {item.displayQuantity && (
                                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 shrink-0">
                                  {item.displayQuantity}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Small Progression Summary */}
      {progressionOverview && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h3 className="font-bold text-xs sm:text-sm text-zinc-100 uppercase tracking-wider font-mono">
                Progression Summary
              </h3>
            </div>
            <Link
              href="/progress"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-800/80 transition-colors"
              title="View Progression & Insights"
              aria-label="View Progression & Insights"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-center">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">
                Week
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-zinc-100">
                {progressionOverview.consistency?.workoutsThisWeek || 0}{' '}
                <span className="text-[10px] text-zinc-500 font-normal">done</span>
              </span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-center">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">
                Month
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                {progressionOverview.consistency?.workoutsThisMonth || 0}{' '}
                <span className="text-[10px] text-zinc-500 font-normal">done</span>
              </span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-center">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">
                Total
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-zinc-200">
                {progressionOverview.consistency?.totalCompletedWorkouts || 0}
              </span>
            </div>
          </div>

          {/* Recent Movement Highlights */}
          {progressionOverview.recentlyTrainedExercises &&
            progressionOverview.recentlyTrainedExercises.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold block">
                  Recent Strength Highlights
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {progressionOverview.recentlyTrainedExercises.slice(0, 2).map(ex => {
                    const lastSet =
                      ex.lastSession?.sets?.find(s => s.completed) || ex.lastSession?.sets?.[0];
                    return (
                      <div
                        key={ex.exerciseId}
                        className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-200 truncate">
                            {ex.exerciseName}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            Peak:{' '}
                            <strong className="text-emerald-400">{ex.highestWeight || 0} kg</strong>
                            {lastSet?.weight
                              ? ` • Last: ${lastSet.weight}kg × ${lastSet.reps || 0}r`
                              : ''}
                          </p>
                        </div>
                        {ex.overallIndicator === 'UP' && (
                          <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 rounded-md">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>UP</span>
                          </span>
                        )}
                        {ex.overallIndicator === 'DOWN' && (
                          <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-mono font-bold text-rose-400 bg-rose-950/80 border border-rose-800/80 px-1.5 py-0.5 rounded-md">
                            <ArrowDownRight className="h-3 w-3" />
                            <span>DOWN</span>
                          </span>
                        )}
                        {ex.overallIndicator === 'SAME' && (
                          <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-mono font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-md">
                            <Minus className="h-3 w-3" />
                            SAME
                          </span>
                        )}
                        {ex.overallIndicator === 'FIRST_TIME' && (
                          <span className="shrink-0 text-[9px] font-mono font-semibold uppercase text-blue-400 bg-blue-950/60 border border-blue-800/60 px-1.5 py-0.5 rounded-md">
                            NEW
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      )}

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
