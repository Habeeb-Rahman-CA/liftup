'use client';

import React, { useState, useMemo } from 'react';
import { Trophy, Clock, Dumbbell, Flame, CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { WorkoutSessionDto } from '@liftup/types';

interface FinishWorkoutModalProps {
  isOpen: boolean;
  session: WorkoutSessionDto;
  elapsedSeconds: number;
  isSubmitting: boolean;
  onClose: () => void;
  onFinish: (note: string, durationMinutes: number) => Promise<void>;
}

export function FinishWorkoutModal({
  isOpen,
  session,
  elapsedSeconds,
  isSubmitting,
  onClose,
  onFinish,
}: FinishWorkoutModalProps) {
  const [note, setNote] = useState(session.note || '');

  // Calculate workout statistics
  const stats = useMemo(() => {
    let totalVolume = 0;
    let completedSetsCount = 0;
    let totalSetsCount = 0;

    session.exerciseLogs?.forEach(log => {
      log.setLogs?.forEach(set => {
        totalSetsCount++;
        if (set.completed) {
          completedSetsCount++;
          const weight = Number(set.weight) || 0;
          const reps = Number(set.reps) || 0;
          totalVolume += weight * reps;
        }
      });
    });

    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));

    return {
      totalVolume: Math.round(totalVolume * 10) / 10,
      completedSetsCount,
      totalSetsCount,
      exerciseCount: session.exerciseLogs?.length || 0,
      durationMinutes: durationMins,
    };
  }, [session, elapsedSeconds]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFinish(note.trim(), stats.durationMinutes);
  };

  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}h ${remainingMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overscroll-none touch-none animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md flex flex-col bg-zinc-950 border border-emerald-800/80 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 touch-auto"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {/* Banner Header with Glow */}
        <div className="relative p-5 text-center bg-gradient-to-b from-emerald-950/70 to-zinc-900/80 border-b border-emerald-900/60 overflow-hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-900/90 border border-emerald-600 text-emerald-300 mx-auto shadow-lg shadow-emerald-950/80">
            <Trophy className="h-6 w-6" />
          </div>

          <h3 className="text-lg font-bold text-zinc-100 mt-2.5">Workout Completed! 🎉</h3>
          <p className="text-xs text-emerald-400 font-medium mt-0.5">
            {session.name || 'Strength Session'}
          </p>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Summary Stat Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            {/* Duration */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <Clock className="h-4 w-4 text-zinc-400 mx-auto" />
              <p className="text-[10px] text-zinc-500 font-medium">Duration</p>
              <p className="text-xs sm:text-sm font-mono font-bold text-zinc-100">
                {formatDuration(elapsedSeconds)}
              </p>
            </div>

            {/* Total Volume */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <Flame className="h-4 w-4 text-emerald-400 mx-auto" />
              <p className="text-[10px] text-zinc-500 font-medium">Total Volume</p>
              <p className="text-xs sm:text-sm font-mono font-bold text-emerald-300">
                {stats.totalVolume.toLocaleString()} kg
              </p>
            </div>

            {/* Completed Sets */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <CheckCircle2 className="h-4 w-4 text-zinc-400 mx-auto" />
              <p className="text-[10px] text-zinc-500 font-medium">Completed Sets</p>
              <p className="text-xs sm:text-sm font-mono font-bold text-zinc-100">
                {stats.completedSetsCount} / {stats.totalSetsCount}
              </p>
            </div>
          </div>

          {/* Session Notes / Reflection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400 block">
              Session Reflection &amp; Notes (Optional)
            </label>
            <Textarea
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
              placeholder="How did the workout feel? Any personal records or notes for next session?"
              className="bg-zinc-900/90 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs min-h-[75px] rounded-xl focus:border-emerald-600 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs h-9 px-3.5 rounded-xl"
            >
              Keep Training
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-9 px-4 rounded-xl font-medium gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Save &amp; Complete</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
