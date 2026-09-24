'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { sessionsApi } from '@/lib/api-client';
import { ExerciseHistoryModal } from '@/components/exercises/exercise-history-modal';
import type { WorkoutSessionDto, WorkoutHistoryResponseDto } from '@liftup/types';

type StatusFilterOption = 'ALL' | 'COMPLETED' | 'SKIPPED';

export default function WorkoutHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<WorkoutHistoryResponseDto>({
    items: [],
    summary: {
      totalCount: 0,
      completedCount: 0,
      skippedCount: 0,
      restCount: 0,
      totalVolume: 0,
      totalSets: 0,
      avgDurationMinutes: 0,
    },
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
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState<{
    id: string;
    name: string;
    category?: string;
  } | null>(null);

  // Fetch paginated history with status and search
  const fetchHistory = useCallback(
    async (pageNum: number, status: StatusFilterOption, search: string) => {
      setLoading(true);
      try {
        const data = await sessionsApi.getHistory({
          page: pageNum,
          limit: 10,
          status,
          search: search.trim() || undefined,
        });
        setHistoryData(data);
      } catch (err) {
        console.error('Failed to load workout history:', err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory(page, statusFilter, searchQuery);
    }
  }, [authLoading, user, page, statusFilter, searchQuery, fetchHistory]);

  const handleStatusTabChange = (newStatus: StatusFilterOption) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

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

  const { summary } = historyData;

  // Filter out any stray rest sessions from display
  const displaySessions = historyData.items.filter(s => s.status !== 'REST');

  return (
    <div className="flex-1 p-3.5 sm:p-8 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 pb-32 sm:pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Workout History
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Completed workouts, volume analytics, and skipped sessions.
          </p>
        </div>
      </div>

      {/* Summary Stats Overview Cards: 3 in a row without side scroll */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Completed</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {summary.completedCount}
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
            <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Skipped</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
            {summary.skippedCount}
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Volume</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-blue-300 truncate">
            {summary.totalVolume > 0 ? (summary.totalVolume / 1000).toFixed(1) + 't' : '0 kg'}
          </div>
        </div>
      </div>

      {/* Status Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Status Filter Tabs (3 in a single row without horizontal scroll) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => handleStatusTabChange('ALL')}
            className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-950 text-zinc-400">
              {summary.completedCount + summary.skippedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusTabChange('COMPLETED')}
            className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5 ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-400 hidden sm:inline" />
            <span>Done</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-950 text-emerald-400">
              {summary.completedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusTabChange('SKIPPED')}
            className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5 ${
              statusFilter === 'SKIPPED'
                ? 'bg-amber-950/90 text-amber-300 border border-amber-800/80 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertCircle className="h-3 w-3 text-amber-400 hidden sm:inline" />
            <span>Skipped</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-950 text-amber-400">
              {summary.skippedCount}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search by routine, reason, note, or exercise..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 h-10 bg-zinc-900/90 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:border-emerald-600 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Session History List */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-sm font-medium">Loading records...</p>
          </div>
        ) : displaySessions.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <History className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-200 mb-1">
              {searchQuery
                ? 'No matching records found'
                : statusFilter === 'SKIPPED'
                  ? 'No skipped workouts on record'
                  : 'No workout history logged yet'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              {searchQuery
                ? 'Try adjusting your search filter keywords.'
                : 'Your completed workouts and skipped session logs will appear here.'}
            </p>
            {!searchQuery && (
              <Link href="/workouts">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs h-9 px-4 gap-2">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  View Workout Schedule
                </Button>
              </Link>
            )}
          </div>
        ) : (
          displaySessions.map(session => {
            const isExpanded = Boolean(expandedSessions[session.id]);
            const isSkipped = session.status === 'SKIPPED';

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

            // If SKIPPED card
            if (isSkipped) {
              return (
                <div
                  key={session.id}
                  className="rounded-2xl bg-zinc-900/80 border border-amber-900/40 shadow-sm overflow-hidden p-4 sm:p-5 transition-colors hover:border-amber-700/60"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-400 mt-0.5">
                        <AlertCircle className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-zinc-100 truncate">
                            {session.name || 'Skipped Workout'}
                          </h3>
                          <span className="text-[10px] font-mono uppercase font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
                            Skipped
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                            {formattedDate} • {formattedTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reason Tag */}
                    {session.skipReason && (
                      <div className="px-3 py-1 rounded-xl bg-amber-950/60 border border-amber-800/70 text-amber-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                        <span className="text-[10px] text-amber-500 uppercase">Why:</span>
                        <span>{session.skipReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Note if entered */}
                  {session.note && (
                    <div className="mt-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-start gap-2 text-xs text-zinc-300">
                      <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-semibold text-zinc-200">Note:</strong>{' '}
                        {session.note}
                      </span>
                    </div>
                  )}
                </div>
              );
            }

            // COMPLETED SESSION Card (with accordion breakdown)
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

                            {el.note && (
                              <div className="px-3 py-1.5 bg-zinc-950/50 border-b border-zinc-800/50 text-xs text-zinc-400 italic">
                                &ldquo;{el.note}&rdquo;
                              </div>
                            )}

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
                                              ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
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
