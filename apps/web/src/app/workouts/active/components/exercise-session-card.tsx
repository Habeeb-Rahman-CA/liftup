'use client';

import React, { useState, useEffect } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Flame,
  MoreVertical,
  FileText,
  Dumbbell,
  Clock,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sessionsApi } from '@/lib/api-client';
import type {
  ExerciseLogDto,
  SetLogDto,
  SetType,
  PreviousExercisePerformanceDto,
} from '@liftup/types';

interface ExerciseSessionCardProps {
  log: ExerciseLogDto;
  index: number;
  onUpdateSet: (setId: string, payload: Partial<SetLogDto>) => Promise<void>;
  onAddSet: (exerciseLogId: string, type?: SetType) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
  onRemoveExercise: (exerciseLogId: string) => Promise<void>;
  onSetCompleted: () => void;
}

export function ExerciseSessionCard({
  log,
  index,
  onUpdateSet,
  onAddSet,
  onDeleteSet,
  onRemoveExercise,
  onSetCompleted,
}: ExerciseSessionCardProps) {
  const [prevPerformance, setPrevPerformance] = useState<PreviousExercisePerformanceDto | null>(
    null,
  );
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [exerciseNote, setExerciseNote] = useState(log.note || '');
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch previous performance for progressive overload reference
  useEffect(() => {
    let isMounted = true;
    sessionsApi
      .getPreviousPerformance(log.exerciseId)
      .then(data => {
        if (isMounted) setPrevPerformance(data);
      })
      .catch(() => {
        // Ignore previous fetch errors
      });

    return () => {
      isMounted = false;
    };
  }, [log.exerciseId]);

  // Handle Set Completion Toggle
  const handleToggleComplete = async (set: SetLogDto) => {
    const nextCompleted = !set.completed;
    await onUpdateSet(set.id, { completed: nextCompleted });

    if (nextCompleted) {
      onSetCompleted();
    }
  };

  // Toggle Set Type (WARMUP <-> WORKING)
  const handleToggleSetType = async (set: SetLogDto) => {
    const nextType: SetType = set.type === 'WARMUP' ? 'WORKING' : 'WARMUP';
    await onUpdateSet(set.id, { type: nextType });
  };

  // Format previous performance for set index
  const getPreviousForSet = (setIdx: number): string => {
    if (!prevPerformance || !prevPerformance.sets || !prevPerformance.sets[setIdx]) {
      return '-';
    }
    const prev = prevPerformance.sets[setIdx];
    if (prev.weight !== null && prev.weight !== undefined && prev.reps !== null) {
      return `${prev.weight}kg × ${prev.reps}`;
    }
    if (prev.reps !== null && prev.reps !== undefined) {
      return `${prev.reps} reps`;
    }
    return '-';
  };

  // Warmup sets strictly appear at the top, followed by working sets
  const orderedSets = React.useMemo(() => {
    if (!log.setLogs) return [];
    const warmups = log.setLogs.filter(s => s.type === 'WARMUP');
    const workings = log.setLogs.filter(s => s.type !== 'WARMUP');

    warmups.sort((a, b) => a.setNumber - b.setNumber);
    workings.sort((a, b) => a.setNumber - b.setNumber);

    return [...warmups, ...workings];
  }, [log.setLogs]);

  const totalWarmups = orderedSets.filter(s => s.type === 'WARMUP').length;
  let warmupCounter = 0;
  let workingCounter = 0;

  const completedSetsCount = log.setLogs?.filter(s => s.completed).length || 0;
  const totalSetsCount = log.setLogs?.length || 0;

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md overflow-hidden transition-colors">
      {/* Exercise Header */}
      <div className="p-3.5 sm:p-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-xs font-semibold shrink-0 mt-0.5">
            {index + 1}
          </span>

          <div className="min-w-0">
            <h4 className="font-bold text-sm text-zinc-100 truncate">
              {log.exercise?.name || 'Exercise'}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                {log.exercise?.category || 'Strength'}
              </span>
              {prevPerformance?.sets?.length ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-medium before:content-['•'] before:mr-1 before:text-zinc-600">
                  <History className="h-3 w-3" />
                  Prev: {prevPerformance.sets[0]?.weight ?? 0}kg ×{' '}
                  {prevPerformance.sets[0]?.reps ?? 0}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Header Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
              completedSetsCount === totalSetsCount && totalSetsCount > 0
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            {completedSetsCount}/{totalSetsCount} Sets
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-7 z-30 w-44 rounded-xl bg-zinc-950 border border-zinc-800 p-1 shadow-xl space-y-0.5"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteInput(!showNoteInput);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 text-left"
                >
                  <FileText className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{showNoteInput ? 'Hide Note' : 'Add Exercise Note'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRemoveExercise(log.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300 text-left"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Exercise</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exercise Cue / Note if present */}
      {(showNoteInput || log.note) && (
        <div className="px-3.5 sm:px-4 py-2 bg-zinc-950/40 border-b border-zinc-800/60">
          <Input
            type="text"
            value={exerciseNote}
            onChange={e => setExerciseNote(e.target.value)}
            placeholder="Exercise cues, seat setting, tempo..."
            className="h-7 text-xs bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-600"
          />
        </div>
      )}

      {/* Sets Table */}
      <div className="p-3 sm:p-4 space-y-2">
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase text-zinc-500 font-semibold px-2 pb-1">
          <div className="col-span-2 text-center">SET</div>
          <div className="col-span-3 text-center">PREVIOUS</div>
          <div className="col-span-3 text-center">KG</div>
          <div className="col-span-3 text-center">REPS</div>
          <div className="col-span-1 text-center">✓</div>
        </div>

        {/* Set Rows (Warmups at the Top, followed by Working sets) */}
        <div className="space-y-1.5">
          {orderedSets.map((set, setIdx) => {
            const isWarmup = set.type === 'WARMUP';
            let displayBadge = '';
            if (isWarmup) {
              warmupCounter++;
              displayBadge = totalWarmups > 1 ? `W${warmupCounter}` : 'W';
            } else {
              workingCounter++;
              displayBadge = `${workingCounter}`;
            }

            const previousLabel = getPreviousForSet(setIdx);

            return (
              <div
                key={set.id}
                className={`grid grid-cols-12 gap-2 items-center p-1.5 sm:p-2 rounded-xl border transition-all ${
                  set.completed
                    ? 'bg-emerald-950/20 border-emerald-900/60'
                    : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Set Type / Sequence Badge */}
                <div className="col-span-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleToggleSetType(set)}
                    className={`h-7 w-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-colors border ${
                      isWarmup
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-zinc-100'
                    }`}
                    title={
                      isWarmup
                        ? 'Warm-up Set (Click to switch to Working)'
                        : 'Working Set (Click to switch to Warm-up)'
                    }
                  >
                    {displayBadge}
                  </button>
                </div>

                {/* Previous Reference */}
                <div className="col-span-3 text-center font-mono text-[11px] text-zinc-400 truncate">
                  {previousLabel}
                </div>

                {/* Weight Input (kg/lbs) */}
                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    defaultValue={set.weight !== null && set.weight !== undefined ? set.weight : ''}
                    onBlur={e => {
                      const val = e.target.value === '' ? null : parseFloat(e.target.value);
                      if (val !== set.weight) {
                        onUpdateSet(set.id, { weight: val });
                      }
                    }}
                    className={`w-full h-8 text-center text-xs font-mono font-bold rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                      set.completed
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Reps Input */}
                <div className="col-span-3">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    defaultValue={set.reps !== null && set.reps !== undefined ? set.reps : ''}
                    onBlur={e => {
                      const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                      if (val !== set.reps) {
                        onUpdateSet(set.id, { reps: val });
                      }
                    }}
                    className={`w-full h-8 text-center text-xs font-mono font-bold rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                      set.completed
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Completion Checkmark Action */}
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(set)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                      set.completed
                        ? 'bg-emerald-900 text-emerald-100 border border-emerald-600 shadow-md shadow-emerald-950/60 scale-105'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-200 hover:border-zinc-600'
                    }`}
                    title={set.completed ? 'Mark incomplete' : 'Mark completed'}
                  >
                    <Check
                      className={`h-4 w-4 ${set.completed ? 'stroke-[2.5]' : 'stroke-[1.5]'}`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls: + Working Set, + Warm-up Set, Delete Set */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddSet(log.id, 'WORKING')}
              className="border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-emerald-400 text-xs h-7 px-2.5 rounded-lg gap-1"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              <span>Add Set</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddSet(log.id, 'WARMUP')}
              className="border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-amber-300 text-xs h-7 px-2 rounded-lg gap-1"
            >
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>Warmup</span>
            </Button>
          </div>

          {log.setLogs && log.setLogs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const lastSet = log.setLogs![log.setLogs!.length - 1];
                onDeleteSet(lastSet.id);
              }}
              className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors p-1"
              title="Delete Last Set"
            >
              Remove last set
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
