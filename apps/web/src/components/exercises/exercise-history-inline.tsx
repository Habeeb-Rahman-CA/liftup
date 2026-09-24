'use client';

import React, { useEffect, useState } from 'react';
import {
  History,
  Trophy,
  TrendingUp,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { sessionsApi } from '@/lib/api-client';
import type { ExerciseHistoryItemDto, PreviousExercisePerformanceDto } from '@liftup/types';

interface ExerciseHistoryInlineProps {
  exerciseId: string;
}

export function ExerciseHistoryInline({ exerciseId }: ExerciseHistoryInlineProps) {
  const [loading, setLoading] = useState(true);
  const [historyItems, setHistoryItems] = useState<ExerciseHistoryItemDto[]>([]);
  const [prevPerformance, setPrevPerformance] = useState<PreviousExercisePerformanceDto | null>(
    null,
  );
  const [showPastLogs, setShowPastLogs] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      sessionsApi.getExerciseHistory(exerciseId).catch(() => []),
      sessionsApi.getPreviousPerformance(exerciseId).catch(() => null),
    ])
      .then(([history, prev]) => {
        if (isMounted) {
          setHistoryItems(history || []);
          setPrevPerformance(prev);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [exerciseId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 text-zinc-500 text-xs font-mono">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
        <span>Loading performance...</span>
      </div>
    );
  }

  // Calculate PR metrics
  let allTimePRWeight = 0;
  let allTimePRReps = 0;
  let allTimeEstimated1RM = 0;
  let totalAllTimeVolume = 0;

  historyItems.forEach(item => {
    if (item.totalVolume) totalAllTimeVolume += item.totalVolume;
    item.sets.forEach(s => {
      if (s.completed && s.weight && s.reps) {
        const e1rm = Math.round(s.weight * (1 + s.reps / 30));
        if (e1rm > allTimeEstimated1RM) {
          allTimeEstimated1RM = e1rm;
          allTimePRWeight = s.weight;
          allTimePRReps = s.reps;
        }
      }
    });
  });

  const hasHistory =
    historyItems.length > 0 || (prevPerformance?.sets && prevPerformance.sets.length > 0);

  if (!hasHistory) {
    return (
      <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-2 text-zinc-500 text-[11px] font-mono">
        <History className="h-3 w-3 text-zinc-600" />
        <span>No previous logs recorded for this exercise yet.</span>
      </div>
    );
  }

  return (
    <div className="pt-2.5 border-t border-zinc-800/80 space-y-2">
      {/* Minimal Header & Stats Strip */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
          <History className="h-3.5 w-3.5 text-emerald-400" />
          <span>Performance & PRs</span>
        </div>

        {allTimeEstimated1RM > 0 && (
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-amber-300 flex items-center gap-1">
              <Trophy className="h-3 w-3 text-amber-400" />
              Best: {allTimePRWeight}kg × {allTimePRReps}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-300 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              1RM: {allTimeEstimated1RM}kg
            </span>
          </div>
        )}
      </div>

      {/* Last Session Compact Box */}
      {prevPerformance && prevPerformance.sets && prevPerformance.sets.length > 0 && (
        <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.2 rounded">
                LAST SESSION
              </span>
              <span className="text-zinc-300 font-medium truncate max-w-[180px] sm:max-w-none">
                {prevPerformance.lastSessionName || 'Previous Workout'}
              </span>
            </div>
            {prevPerformance.lastPerformedAt && (
              <span className="text-zinc-500 text-[10px]">
                {new Date(prevPerformance.lastPerformedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Previous Sets Minimal Tags */}
          <div className="flex flex-wrap gap-1.5">
            {prevPerformance.sets.map((s, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-200"
              >
                {s.weight !== null && s.weight !== undefined ? `${s.weight}kg` : ''} × {s.reps ?? 0}
              </span>
            ))}
          </div>

          {/* Previous Note */}
          {prevPerformance.previousNote && (
            <div className="flex items-start gap-1.5 text-[11px] font-sans text-zinc-300 pt-0.5">
              <FileText className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
              <span className="italic text-zinc-300">
                <strong className="text-amber-400 font-mono not-italic font-semibold">
                  Note:{' '}
                </strong>
                {prevPerformance.previousNote}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Past Sessions Accordion Toggle */}
      {historyItems.length > 1 && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setShowPastLogs(!showPastLogs)}
            className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <span>Past Sessions ({historyItems.length})</span>
            {showPastLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showPastLogs && (
            <div className="space-y-1 pt-1 animate-in fade-in-50 duration-100">
              {historyItems.slice(1, 5).map((item, idx) => (
                <div
                  key={item.sessionId || idx}
                  className="px-2.5 py-1.5 rounded bg-zinc-900/50 border border-zinc-800/60 text-[11px] font-mono flex items-center justify-between gap-2"
                >
                  <span className="text-zinc-300 truncate">{item.sessionName}</span>
                  <div className="flex items-center gap-2 text-zinc-400 shrink-0">
                    {item.maxWeight ? (
                      <span className="text-emerald-400 font-bold">{item.maxWeight}kg</span>
                    ) : null}
                    <span className="text-zinc-500">
                      {new Date(item.performedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
