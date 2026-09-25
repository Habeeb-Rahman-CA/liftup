'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  History,
  Trophy,
  Flame,
  Dumbbell,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { sessionsApi } from '@/lib/api-client';
import type { ExerciseHistoryItemDto, PreviousExercisePerformanceDto } from '@liftup/types';

interface ExerciseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string | null;
  exerciseName?: string;
  category?: string;
}

export function ExerciseHistoryModal({
  isOpen,
  onClose,
  exerciseId,
  exerciseName,
  category,
}: ExerciseHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<ExerciseHistoryItemDto[]>([]);
  const [prevPerformance, setPrevPerformance] = useState<PreviousExercisePerformanceDto | null>(
    null,
  );

  useEffect(() => {
    if (isOpen && exerciseId) {
      setLoading(true);
      Promise.all([
        sessionsApi.getExerciseHistory(exerciseId).catch(() => []),
        sessionsApi.getPreviousPerformance(exerciseId).catch(() => null),
      ])
        .then(([history, prev]) => {
          setHistoryItems(history || []);
          setPrevPerformance(prev);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setHistoryItems([]);
      setPrevPerformance(null);
    }
  }, [isOpen, exerciseId]);

  if (!isOpen) return null;

  // Calculate overall PR metrics
  let allTimePRWeight = 0;
  let allTimePRReps = 0;
  let allTimeEstimated1RM = 0;
  let totalAllTimeVolume = 0;
  let totalSetsCompleted = 0;

  historyItems.forEach(item => {
    if (item.totalVolume) totalAllTimeVolume += item.totalVolume;
    item.sets.forEach(s => {
      if (s.completed && s.weight && s.reps) {
        totalSetsCompleted++;
        const e1rm = Math.round(s.weight * (1 + s.reps / 30));
        if (e1rm > allTimeEstimated1RM) {
          allTimeEstimated1RM = e1rm;
          allTimePRWeight = s.weight;
          allTimePRReps = s.reps;
        }
      }
    });
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-safe animate-in fade-in-50 duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-50 w-full max-w-xl modal-safe-bounds flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 pb-4 border-b border-zinc-800 bg-zinc-900/60 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                {category || 'Strength'}
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                <History className="h-3.5 w-3.5 text-zinc-500" />
                Performance History
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 truncate">
              {exerciseName || prevPerformance?.exerciseName || 'Exercise History'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Past performance, progressive overload trajectory, and personal records.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors shrink-0"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PR Highlights Bar */}
        {allTimeEstimated1RM > 0 && (
          <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-zinc-900/40 border-b border-zinc-800/80 shrink-0">
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-amber-400 uppercase font-semibold mb-0.5">
                <Trophy className="h-3 w-3" />
                Best Set
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-zinc-100">
                {allTimePRWeight}kg <span className="text-xs text-zinc-400">× {allTimePRReps}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-emerald-400 uppercase font-semibold mb-0.5">
                <TrendingUp className="h-3 w-3" />
                Est. 1RM
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-emerald-300">
                {allTimeEstimated1RM} <span className="text-xs font-normal">kg</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-zinc-400 uppercase font-semibold mb-0.5">
                <Dumbbell className="h-3 w-3" />
                Lifetime Vol
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-zinc-200">
                {totalAllTimeVolume > 0 ? (totalAllTimeVolume / 1000).toFixed(1) + 'k' : '0'}{' '}
                <span className="text-xs font-normal text-zinc-500">kg</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
              <p className="text-sm font-medium">Loading performance history...</p>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/60">
              <History className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-zinc-300 mb-1">No Previous Sessions Yet</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Once you complete workouts with this exercise, all your weights, reps, estimated 1RM
                records, and cues will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyItems.map((item, idx) => {
                const dateObj = new Date(item.performedAt);
                const formattedDate = dateObj.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={item.sessionId || idx}
                    className="rounded-xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-sm hover:border-zinc-700 transition-colors"
                  >
                    {/* Session Item Header */}
                    <div className="p-3.5 bg-zinc-900/90 border-b border-zinc-800/80 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-100">
                            {item.sessionName}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.2 rounded">
                              LATEST
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-zinc-500" />
                            {formattedDate}
                          </span>
                          {item.durationMinutes && (
                            <span className="flex items-center gap-1 before:content-['•'] before:mr-1 before:text-zinc-600">
                              <Clock className="h-3 w-3 text-zinc-500" />
                              {item.durationMinutes}m
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {item.maxWeight ? (
                          <div className="text-xs font-mono font-bold text-zinc-200">
                            Max: <span className="text-emerald-400">{item.maxWeight}kg</span>
                          </div>
                        ) : null}
                        {item.totalVolume ? (
                          <div className="text-[10px] font-mono text-zinc-400">
                            Vol: {item.totalVolume.toLocaleString()} kg
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Previous Exercise Note if recorded */}
                    {item.exerciseNote && (
                      <div className="px-3.5 py-2 bg-zinc-950/60 border-b border-zinc-800/60 flex items-start gap-2 text-xs text-zinc-300">
                        <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="italic font-sans text-zinc-300">
                          &quot;{item.exerciseNote}&quot;
                        </span>
                      </div>
                    )}

                    {/* Sets Breakdown */}
                    <div className="p-3">
                      <div className="grid grid-cols-12 gap-1 text-[10px] font-mono uppercase text-zinc-500 font-semibold px-1 pb-1">
                        <div className="col-span-2 text-center">SET</div>
                        <div className="col-span-4 text-center">WEIGHT</div>
                        <div className="col-span-4 text-center">REPS</div>
                        <div className="col-span-2 text-center">STATUS</div>
                      </div>

                      <div className="space-y-1">
                        {item.sets.map((s, sIdx) => {
                          const isWarmup = s.type === 'WARMUP';
                          return (
                            <div
                              key={sIdx}
                              className={`grid grid-cols-12 gap-1 items-center px-2 py-1.5 rounded-lg text-xs font-mono ${
                                s.completed
                                  ? 'bg-zinc-950/60 text-zinc-200 border border-zinc-800/50'
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
                                {s.reps !== null && s.reps !== undefined ? `${s.reps} reps` : '-'}
                              </div>

                              <div className="col-span-2 flex justify-center">
                                {s.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
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
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-900/80 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs h-8 px-4"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
