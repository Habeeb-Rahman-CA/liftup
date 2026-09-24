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
  TrendingUp,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sessionsApi } from '@/lib/api-client';
import { ExerciseHistoryModal } from '@/components/exercises/exercise-history-modal';
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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrevCard, setShowPrevCard] = useState(true);
  const [isAutofilling, setIsAutofilling] = useState(false);

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

  // Autofill all uncompleted sets with previous session weights & reps
  const handleAutofillAll = async () => {
    if (!prevPerformance || !prevPerformance.sets?.length || !log.setLogs?.length) return;
    setIsAutofilling(true);
    try {
      const promises = log.setLogs.map(async (set, idx) => {
        const prevSet = prevPerformance.sets[idx];
        if (prevSet && (!set.weight || !set.reps)) {
          const updates: Partial<SetLogDto> = {};
          if (prevSet.weight !== null && prevSet.weight !== undefined && !set.weight) {
            updates.weight = prevSet.weight;
          }
          if (prevSet.reps !== null && prevSet.reps !== undefined && !set.reps) {
            updates.reps = prevSet.reps;
          }
          if (Object.keys(updates).length > 0) {
            await onUpdateSet(set.id, updates);
          }
        }
      });
      await Promise.all(promises);
    } finally {
      setIsAutofilling(false);
    }
  };

  // Autofill single set from previous reference
  const handleAutofillSingleSet = async (set: SetLogDto, prevIndex: number) => {
    if (!prevPerformance || !prevPerformance.sets || !prevPerformance.sets[prevIndex]) return;
    const prev = prevPerformance.sets[prevIndex];
    const updates: Partial<SetLogDto> = {};
    if (prev.weight !== null && prev.weight !== undefined) {
      updates.weight = prev.weight;
    }
    if (prev.reps !== null && prev.reps !== undefined) {
      updates.reps = prev.reps;
    }
    if (Object.keys(updates).length > 0) {
      await onUpdateSet(set.id, updates);
    }
  };

  // Format previous performance for set index
  const getPreviousForSet = (setIdx: number): { text: string; hasData: boolean } => {
    if (!prevPerformance || !prevPerformance.sets || !prevPerformance.sets[setIdx]) {
      return { text: '-', hasData: false };
    }
    const prev = prevPerformance.sets[setIdx];
    if (
      prev.weight !== null &&
      prev.weight !== undefined &&
      prev.reps !== null &&
      prev.reps !== undefined
    ) {
      return { text: `${prev.weight}kg × ${prev.reps}`, hasData: true };
    }
    if (prev.reps !== null && prev.reps !== undefined) {
      return { text: `${prev.reps} reps`, hasData: true };
    }
    return { text: '-', hasData: false };
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

  const hasPreviousData = Boolean(
    prevPerformance && prevPerformance.sets && prevPerformance.sets.length > 0,
  );

  // Relative time string for last session
  const getLastSessionTimeAgo = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

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
              {hasPreviousData ? (
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-medium before:content-['•'] before:mr-1 before:text-zinc-600 transition-colors"
                >
                  <History className="h-3 w-3" />
                  <span>History</span>
                </button>
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
                    setShowHistoryModal(true);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 text-left"
                >
                  <History className="h-3.5 w-3.5 text-emerald-400" />
                  <span>View Full History</span>
                </button>
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

      {/* PHASE 5: LAST PERFORMANCE CARD */}
      {hasPreviousData && (
        <div className="bg-zinc-950/70 border-b border-zinc-800/80 px-3.5 py-2.5 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                LAST SESSION
              </span>
              <span className="text-xs text-zinc-300 font-medium truncate">
                {prevPerformance?.lastSessionName || 'Previous Workout'}
              </span>
              {prevPerformance?.lastPerformedAt && (
                <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                  • {getLastSessionTimeAgo(prevPerformance.lastPerformedAt)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAutofillAll}
                disabled={isAutofilling}
                className="flex items-center gap-1 text-[11px] font-mono text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 px-2 py-0.5 rounded-lg transition-colors"
                title="Autofill current empty sets with previous weights & reps"
              >
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>{isAutofilling ? 'Copying...' : 'Autofill'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrevCard(!showPrevCard)}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
                title={showPrevCard ? 'Collapse previous info' : 'Expand previous info'}
              >
                {showPrevCard ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {showPrevCard && (
            <div className="mt-2 space-y-1.5 pt-1.5 border-t border-zinc-800/50 text-xs">
              {/* Previous Note / Coaching Cue */}
              {prevPerformance?.previousNote && (
                <div className="flex items-start gap-1.5 text-zinc-300 bg-zinc-900/90 rounded-lg p-2 border border-zinc-800/80">
                  <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="italic text-zinc-300">"{prevPerformance.previousNote}"</span>
                </div>
              )}

              {/* Best Set & Est 1RM pill */}
              {prevPerformance?.bestSet && (
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1 text-amber-300">
                    <TrendingUp className="h-3 w-3 text-amber-400" />
                    Best: {prevPerformance.bestSet.weight}kg × {prevPerformance.bestSet.reps}
                  </span>
                  {prevPerformance.estimated1RM ? (
                    <span className="text-zinc-400 before:content-['•'] before:mr-1 before:text-zinc-600">
                      Est. 1RM:{' '}
                      <strong className="text-emerald-300 font-bold">
                        {prevPerformance.estimated1RM}kg
                      </strong>
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Exercise Cue / Note input */}
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

            const previousInfo = getPreviousForSet(setIdx);

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

                {/* Previous Reference (Clickable to autofill this set) */}
                <div className="col-span-3 flex justify-center">
                  {previousInfo.hasData ? (
                    <button
                      type="button"
                      onClick={() => handleAutofillSingleSet(set, setIdx)}
                      className="font-mono text-[11px] text-zinc-400 hover:text-emerald-300 hover:bg-zinc-900 px-1.5 py-0.5 rounded transition-colors truncate max-w-full"
                      title="Click to copy into current set"
                    >
                      {previousInfo.text}
                    </button>
                  ) : (
                    <span className="font-mono text-[11px] text-zinc-600">-</span>
                  )}
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

      {/* Full Exercise History Modal */}
      <ExerciseHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        exerciseId={log.exerciseId}
        exerciseName={log.exercise?.name}
        category={log.exercise?.category}
      />
    </div>
  );
}
