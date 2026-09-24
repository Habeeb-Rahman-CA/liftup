'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  History,
  Calendar,
  Clock,
  Dumbbell,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Flame,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Loader2,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { sessionsApi } from '@/lib/api-client';
import { ExerciseHistoryModal } from '@/components/exercises/exercise-history-modal';
import type { WorkoutSessionDto, PaginatedResult } from '@liftup/types';

export default function WorkoutHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<PaginatedResult<WorkoutSessionDto>>({
    items: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState<{
    id: string;
    name: string;
    category?: string;
  } | null>(null);

  // Fetch paginated history
  const fetchHistory = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await sessionsApi.getHistory(pageNum, 10);
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to load workout history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory(page);
    }
  }, [authLoading, user, page]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const toggleExpand = (sessionId: string) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  // Filter sessions by search query
  const filteredSessions = historyData.items.filter(session => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesName = session.name?.toLowerCase().includes(query);
    const matchesNote = session.note?.toLowerCase().includes(query);
    const matchesExercise = session.exerciseLogs?.some(el =>
      el.exercise?.name.toLowerCase().includes(query),
    );
    return matchesName || matchesNote || matchesExercise;
  });

  // Calculate high-level summary metrics across loaded sessions
  const totalVolumeAcrossLoaded = historyData.items.reduce((acc, sess) => {
    const sessVol = (sess.exerciseLogs || []).reduce((elAcc, el) => {
      const elVol = (el.setLogs || []).reduce((setAcc, s) => {
        if (s.completed && s.weight && s.reps) {
          return setAcc + s.weight * s.reps;
        }
        return setAcc;
      }, 0);
      return elAcc + elVol;
    }, 0);
    return acc + sessVol;
  }, 0);

  const totalSetsAcrossLoaded = historyData.items.reduce((acc, sess) => {
    const sessSets = (sess.exerciseLogs || []).reduce((elAcc, el) => {
      return elAcc + (el.setLogs?.filter(s => s.completed).length || 0);
    }, 0);
    return acc + sessSets;
  }, 0);

  // Calculate avg duration across completed sessions
  const validDurations = historyData.items
    .map(sess => sess.durationMinutes)
    .filter((d): d is number => typeof d === 'number' && d > 0);
  const avgDuration = validDurations.length
    ? Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length)
    : 0;

  return (
    <div className="flex-1 p-3.5 sm:p-8 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 pb-32 sm:pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400">
              <History className="h-4 w-4" />
            </span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              Logs & Archives
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Workout History
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Past workouts, volume analytics, and progressive overload history.
          </p>
        </div>
      </div>

      {/* Summary Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-1">
            <Trophy className="h-3.5 w-3.5 text-emerald-400" />
            <span>Workouts Done</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
            {historyData.meta.total}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-1">
            <Dumbbell className="h-3.5 w-3.5 text-blue-400" />
            <span>Total Sets</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
            {totalSetsAcrossLoaded.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
            <span>Volume Logged</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300">
            {totalVolumeAcrossLoaded > 0
              ? (totalVolumeAcrossLoaded / 1000).toFixed(1) + 't'
              : '0 kg'}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-1">
            <Clock className="h-3.5 w-3.5 text-purple-400" />
            <span>Avg Duration</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-purple-300">
            {avgDuration > 0 ? `${avgDuration}m` : '—'}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          type="text"
          placeholder="Filter by session name, exercise, or note..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 h-10 bg-zinc-900/90 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:border-emerald-600 text-xs sm:text-sm"
        />
      </div>

      {/* Session History List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-sm font-medium">Loading workout history...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <History className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-200 mb-1">
              {searchQuery ? 'No matching workouts found' : 'No workout sessions completed yet'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              {searchQuery
                ? 'Try adjusting your search filter keywords.'
                : 'Start logging workouts to track your progressive overload and lifetime lifting volume.'}
            </p>
            {!searchQuery && (
              <Link href="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs h-9 px-4 gap-2">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start a Workout
                </Button>
              </Link>
            )}
          </div>
        ) : (
          filteredSessions.map(session => {
            const isExpanded = Boolean(expandedSessions[session.id]);
            const dateObj = session.startedAt
              ? new Date(session.startedAt)
              : new Date(session.createdAt);
            const formattedDate = dateObj.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = dateObj.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            });

            // Calculate session volume & completed sets count
            let sessionVolume = 0;
            let completedSetsCount = 0;
            let totalSetsCount = 0;

            (session.exerciseLogs || []).forEach(el => {
              (el.setLogs || []).forEach(s => {
                totalSetsCount++;
                if (s.completed) {
                  completedSetsCount++;
                  if (s.weight && s.reps) {
                    sessionVolume += s.weight * s.reps;
                  }
                }
              });
            });

            return (
              <div
                key={session.id}
                className="rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md overflow-hidden transition-all hover:border-zinc-700"
              >
                {/* Session Header Card */}
                <div
                  onClick={() => toggleExpand(session.id)}
                  className="p-4 sm:p-5 cursor-pointer select-none bg-zinc-900/60 hover:bg-zinc-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 mt-0.5">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-zinc-100 truncate">
                          {session.name || 'Workout Session'}
                        </h3>
                        <span className="text-[10px] font-mono uppercase font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                          {formattedDate} • {formattedTime}
                        </span>
                        {session.durationMinutes && (
                          <span className="flex items-center gap-1 before:content-['•'] before:mr-1 before:text-zinc-600">
                            <Clock className="h-3.5 w-3.5 text-zinc-500" />
                            {session.durationMinutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Header Stats & Accordion Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                    <div className="flex items-center gap-2 text-right">
                      {sessionVolume > 0 && (
                        <div className="px-2.5 py-1 rounded-lg bg-zinc-950/80 border border-zinc-800 text-right">
                          <div className="text-[10px] font-mono text-zinc-400">Volume</div>
                          <div className="text-xs font-bold font-mono text-amber-400">
                            {sessionVolume.toLocaleString()} kg
                          </div>
                        </div>
                      )}

                      <div className="px-2.5 py-1 rounded-lg bg-zinc-950/80 border border-zinc-800 text-right">
                        <div className="text-[10px] font-mono text-zinc-400">Sets</div>
                        <div className="text-xs font-bold font-mono text-zinc-200">
                          {completedSetsCount}/{totalSetsCount}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Session Note if present */}
                {session.note && (
                  <div className="px-4 sm:px-5 py-2.5 bg-zinc-950/60 border-t border-zinc-800/60 flex items-start gap-2 text-xs text-zinc-300">
                    <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold text-zinc-200">Note:</strong> {session.note}
                    </span>
                  </div>
                )}

                {/* Expanded Session Exercise & Set Details */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/80 bg-zinc-950/40 p-4 sm:p-5 space-y-4">
                    <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                      Exercise Breakdown ({session.exerciseLogs?.length || 0} exercises)
                    </div>

                    <div className="space-y-3">
                      {(session.exerciseLogs || []).map((el, elIdx) => {
                        const exerciseName = el.exercise?.name || 'Exercise';
                        const exerciseCategory = el.exercise?.category || 'Strength';

                        return (
                          <div
                            key={el.id || elIdx}
                            className="rounded-xl bg-zinc-900/80 border border-zinc-800/80 overflow-hidden"
                          >
                            {/* Exercise Sub-header */}
                            <div className="p-3 bg-zinc-900/90 border-b border-zinc-800/60 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono font-bold text-zinc-300">
                                  {elIdx + 1}
                                </span>
                                <span className="font-bold text-sm text-zinc-100 truncate">
                                  {exerciseName}
                                </span>
                                <span className="text-[10px] font-mono uppercase text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                                  {exerciseCategory}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedExerciseForHistory({
                                    id: el.exerciseId,
                                    name: exerciseName,
                                    category: exerciseCategory,
                                  })
                                }
                                className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 hover:underline shrink-0"
                              >
                                <History className="h-3 w-3" />
                                <span>Progression</span>
                              </button>
                            </div>

                            {/* Exercise Note if present */}
                            {el.note && (
                              <div className="px-3 py-1.5 bg-zinc-950/50 border-b border-zinc-800/50 text-xs text-zinc-400 italic">
                                "{el.note}"
                              </div>
                            )}

                            {/* Sets Table */}
                            <div className="p-2.5">
                              <div className="grid grid-cols-12 gap-1 text-[10px] font-mono uppercase text-zinc-500 font-semibold px-2 pb-1">
                                <div className="col-span-2 text-center">SET</div>
                                <div className="col-span-4 text-center">WEIGHT</div>
                                <div className="col-span-4 text-center">REPS</div>
                                <div className="col-span-2 text-center">STATUS</div>
                              </div>

                              <div className="space-y-1">
                                {(el.setLogs || []).map((s, sIdx) => {
                                  const isWarmup = s.type === 'WARMUP';
                                  return (
                                    <div
                                      key={s.id || sIdx}
                                      className={`grid grid-cols-12 gap-1 items-center px-2 py-1.5 rounded-lg text-xs font-mono ${
                                        s.completed
                                          ? 'bg-zinc-950/70 text-zinc-200 border border-zinc-800/40'
                                          : 'bg-zinc-950/30 text-zinc-500'
                                      }`}
                                    >
                                      <div className="col-span-2 text-center">
                                        <span
                                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            isWarmup
                                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                              : 'bg-zinc-800 text-zinc-300'
                                          }`}
                                        >
                                          {isWarmup ? `W${s.setNumber}` : s.setNumber}
                                        </span>
                                      </div>

                                      <div className="col-span-4 text-center font-bold">
                                        {s.weight !== null && s.weight !== undefined
                                          ? `${s.weight} kg`
                                          : '-'}
                                      </div>

                                      <div className="col-span-4 text-center">
                                        {s.reps !== null && s.reps !== undefined
                                          ? `${s.reps} reps`
                                          : '-'}
                                      </div>

                                      <div className="col-span-2 flex justify-center">
                                        {s.completed ? (
                                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                        ) : (
                                          <span className="text-[10px] text-zinc-600">—</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {historyData.meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!historyData.meta.hasPreviousPage || loading}
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs h-8 gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </Button>

          <span className="text-xs font-mono text-zinc-400">
            Page {historyData.meta.page} of {historyData.meta.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={!historyData.meta.hasNextPage || loading}
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs h-8 gap-1"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Exercise Progression Modal */}
      {selectedExerciseForHistory && (
        <ExerciseHistoryModal
          isOpen={Boolean(selectedExerciseForHistory)}
          onClose={() => setSelectedExerciseForHistory(null)}
          exerciseId={selectedExerciseForHistory.id}
          exerciseName={selectedExerciseForHistory.name}
          category={selectedExerciseForHistory.category}
        />
      )}
    </div>
  );
}
