'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Flame,
  Calendar,
  Dumbbell,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  FileText,
  Clock,
  ChevronRight,
  Search,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { progressionApi, exercisesApi } from '@/lib/api-client';
import type {
  ProgressOverviewDto,
  ExerciseProgressionDto,
  ProgressionIndicator,
  ExerciseDto,
} from '@liftup/types';

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<ProgressOverviewDto | null>(null);
  const [exercisesList, setExercisesList] = useState<ExerciseDto[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedExerciseProgression, setSelectedExerciseProgression] =
    useState<ExerciseProgressionDto | null>(null);
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      Promise.all([
        progressionApi.getOverview().catch(() => null),
        exercisesApi.getAll({ isActive: true }).catch(() => []),
      ])
        .then(([overviewData, exList]) => {
          setOverview(overviewData);
          setExercisesList(exList);
          if (overviewData?.recentlyTrainedExercises?.length) {
            setSelectedExerciseId(overviewData.recentlyTrainedExercises[0].exerciseId);
            setSelectedExerciseProgression(overviewData.recentlyTrainedExercises[0]);
          } else if (exList.length) {
            setSelectedExerciseId(exList[0].id);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [authLoading, user]);

  // Load selected exercise progression details
  const handleSelectExercise = async (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setExerciseLoading(true);
    try {
      const data = await progressionApi.getExerciseProgression(exerciseId);
      setSelectedExerciseProgression(data);
    } catch (err) {
      console.error('Failed to load exercise progression:', err);
    } finally {
      setExerciseLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Filter exercises in selector
  const filteredExercises = exercisesList.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getIndicatorBadge = (indicator: ProgressionIndicator, weightDelta?: number | null) => {
    switch (indicator) {
      case 'UP':
        return (
          <span className="flex items-center gap-0.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-md">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{weightDelta && weightDelta > 0 ? `+${weightDelta}kg` : 'UP'}</span>
          </span>
        );
      case 'DOWN':
        return (
          <span className="flex items-center gap-0.5 text-xs font-mono font-bold text-red-400 bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded-md">
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>{weightDelta ? `${weightDelta}kg` : 'DOWN'}</span>
          </span>
        );
      case 'SAME':
        return (
          <span className="flex items-center gap-0.5 text-xs font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
            <Minus className="h-3.5 w-3.5" />
            <span>SAME</span>
          </span>
        );
      case 'FIRST_TIME':
      default:
        return (
          <span className="text-[10px] font-mono font-semibold uppercase text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-md">
            BASELINE
          </span>
        );
    }
  };

  return (
    <div className="flex-1 p-3.5 sm:p-8 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 pb-32 sm:pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </span>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
            Phase 6 • Progression
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
          Progression & Insights
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Workout consistency, strength history, and progressive overload benchmarks.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
          <p className="text-sm font-medium">Loading progression insights...</p>
        </div>
      ) : (
        <>
          {/* SECTION 1: WORKOUT CONSISTENCY */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" />
                <h3 className="font-bold text-sm text-zinc-100 uppercase tracking-wider font-mono">
                  Workout Consistency
                </h3>
              </div>
              {overview?.consistency?.workoutsThisWeek ? (
                <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                  Active This Week
                </span>
              ) : null}
            </div>

            {/* Consistency Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-center">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">
                  This Week
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-zinc-100">
                  {overview?.consistency?.workoutsThisWeek || 0}{' '}
                  <span className="text-xs text-zinc-500 font-normal">workouts</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-center">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">
                  This Month
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                  {overview?.consistency?.workoutsThisMonth || 0}{' '}
                  <span className="text-xs text-zinc-500 font-normal">workouts</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-center">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">
                  Lifetime Total
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-zinc-200">
                  {overview?.consistency?.totalCompletedWorkouts || 0}{' '}
                  <span className="text-xs text-zinc-500 font-normal">done</span>
                </span>
              </div>
            </div>

            {/* 4-Week Activity Heatmap */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold block">
                Last 4 Weeks Activity (Mon – Sun)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(overview?.consistency?.weeklyHistory || []).map((w, wIdx) => (
                  <div
                    key={wIdx}
                    className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span>{w.weekLabel}</span>
                      <span className="text-zinc-200 font-bold">{w.completedCount}d</span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      {[1, 2, 3, 4, 5, 6, 7].map(day => {
                        const isActive = w.daysActive.includes(day);
                        return (
                          <div
                            key={day}
                            className={`h-2 flex-1 rounded-sm ${
                              isActive
                                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                                : 'bg-zinc-800'
                            }`}
                            title={`Day ${day}: ${isActive ? 'Completed' : 'Rest'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: EXERCISE PERFORMANCE & PROGRESSION (Deep Dive) */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-blue-400" />
                <h3 className="font-bold text-sm text-zinc-100 uppercase tracking-wider font-mono">
                  Exercise Progression
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                Select an exercise to answer progression questions
              </span>
            </div>

            {/* Exercise Selector Pills */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Filter exercises..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-zinc-950 border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {filteredExercises.slice(0, 12).map(ex => {
                  const isSelected = selectedExerciseId === ex.id;
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => handleSelectExercise(ex.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {ex.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Progression Q&A Card */}
            {exerciseLoading ? (
              <div className="p-8 text-center flex items-center justify-center gap-2 text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                <span className="text-xs">Loading exercise progression...</span>
              </div>
            ) : selectedExerciseProgression ? (
              <div className="space-y-3 pt-1">
                {/* Exercise Title & Indicator Header */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded font-semibold">
                      {selectedExerciseProgression.category}
                    </span>
                    <h4 className="text-base font-bold text-zinc-100 mt-0.5">
                      {selectedExerciseProgression.exerciseName}
                    </h4>
                  </div>

                  {getIndicatorBadge(selectedExerciseProgression.overallIndicator)}
                </div>

                {/* What should I reference today? Spotlight */}
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    <span>What Should I Reference Today?</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-100">
                    {selectedExerciseProgression.todayReference.headline}
                  </div>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    {selectedExerciseProgression.todayReference.suggestion}
                  </p>
                </div>

                {/* Progression Answers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* What was my highest weight? */}
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                      Highest Weight Logged
                    </span>
                    <div className="text-sm sm:text-base font-bold font-mono text-zinc-100">
                      {selectedExerciseProgression.highestWeight ? (
                        <>
                          {selectedExerciseProgression.highestWeight}kg{' '}
                          {selectedExerciseProgression.highestWeightReps ? (
                            <span className="text-xs text-zinc-400 font-normal">
                              (for {selectedExerciseProgression.highestWeightReps} reps)
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-xs text-zinc-500 font-normal">Not logged yet</span>
                      )}
                    </div>
                  </div>

                  {/* What were my max reps? */}
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                      Highest Reps Achieved
                    </span>
                    <div className="text-sm sm:text-base font-bold font-mono text-zinc-100">
                      {selectedExerciseProgression.highestReps ? (
                        `${selectedExerciseProgression.highestReps} reps`
                      ) : (
                        <span className="text-xs text-zinc-500 font-normal">Not logged yet</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* What was my previous note? */}
                {selectedExerciseProgression.previousNote && (
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-amber-400">
                      <FileText className="h-3 w-3" />
                      <span>Previous Session Note / Cue:</span>
                    </div>
                    <p className="text-xs text-zinc-200 italic pl-4">
                      "{selectedExerciseProgression.previousNote}"
                    </p>
                  </div>
                )}

                {/* Checkpoints Timeline (Weight & Rep Progression) */}
                {selectedExerciseProgression.recentCheckpoints.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold block">
                      Weight & Rep Progression History (
                      {selectedExerciseProgression.recentCheckpoints.length} sessions)
                    </span>

                    <div className="space-y-1.5">
                      {selectedExerciseProgression.recentCheckpoints.map((cp, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between gap-3 text-xs font-mono"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-200 truncate">
                                {cp.sessionName}
                              </span>
                              {idx === 0 && (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-1 py-0.2 rounded">
                                  LATEST
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(cp.date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="font-bold text-zinc-100">
                                {cp.topWeight ? `${cp.topWeight}kg` : '-'} × {cp.topReps ?? 0}
                              </div>
                            </div>
                            {getIndicatorBadge(cp.indicator, cp.weightDelta)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* SECTION 3: STRENGTH HISTORY & LIFETIME METRICS */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <h3 className="font-bold text-sm text-zinc-100 uppercase tracking-wider font-mono">
                  Strength & Volume
                </h3>
              </div>
              <div className="text-xs font-mono text-amber-400 font-bold">
                {overview?.strength?.totalVolumeAllTime
                  ? `${(overview.strength.totalVolumeAllTime / 1000).toFixed(1)} tons`
                  : '0 kg'}
              </div>
            </div>

            {/* Top Progressed Exercises */}
            {(overview?.strength?.topProgressedExercises || []).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {overview?.strength.topProgressedExercises.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase text-zinc-500">
                        {item.category}
                      </span>
                      <h5 className="text-xs font-bold text-zinc-200 truncate">
                        {item.exerciseName}
                      </h5>
                      <span className="text-[11px] font-mono text-zinc-400">
                        Current: {item.lastWeight}kg × {item.lastReps}
                      </span>
                    </div>

                    {getIndicatorBadge(item.indicator, item.weightGain)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 font-mono py-2">
                Log completed workout sessions to track strength trends and progressive overload
                over time.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
