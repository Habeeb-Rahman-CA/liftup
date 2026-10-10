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
  Calculator,
  Gauge,
  Hash,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sessionsApi } from '@/lib/api-client';
import { PlateCalculatorModal } from '@/components/calculator/plate-calculator-modal';
import { NumericKeypadModal } from '@/components/calculator/numeric-keypad-modal';
import { playChime } from '@/lib/audio-chime';
import type {
  ExerciseLogDto,
  SetLogDto,
  SetType,
  PreviousExercisePerformanceDto,
} from '@liftup/types';

interface ControlledSetInputProps {
  value: number | null | undefined;
  onCommit: (val: number | null) => void;
  parseFn: (raw: string) => number | null;
  inputMode: 'decimal' | 'numeric';
  step: string;
  min: string;
  placeholder: string;
  className: string;
}

function ControlledSetInput({
  value,
  onCommit,
  parseFn,
  inputMode,
  step,
  min,
  placeholder,
  className,
}: ControlledSetInputProps) {
  const [localVal, setLocalVal] = useState<string>(
    value !== null && value !== undefined ? String(value) : '',
  );
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Synchronize local input state whenever external prop value changes (e.g. Autofill, copy prev)
  useEffect(() => {
    setLocalVal(value !== null && value !== undefined ? String(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalVal(raw);
    const parsed = parseFn(raw);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (parsed !== value) {
        onCommit(parsed);
      }
    }, 350);
  };

  const handleBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const parsed = parseFn(localVal);
    if (parsed !== value) {
      onCommit(parsed);
    }
  };

  return (
    <input
      type="number"
      inputMode={inputMode}
      step={step}
      min={min}
      placeholder={placeholder}
      value={localVal}
      onFocus={e => e.target.select()}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
}

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
  const [showPrevCard, setShowPrevCard] = useState(true);
  const [isAutofilling, setIsAutofilling] = useState(false);

  // Ergonomics state: Plate Calculator, Numeric Keypad, RPE chips
  const [plateCalcOpen, setPlateCalcOpen] = useState(false);
  const [plateCalcWeight, setPlateCalcWeight] = useState<number>(60);
  const [keypadTarget, setKeypadTarget] = useState<{
    setId: string;
    field: 'weight' | 'reps';
    initialValue: number | null;
    title: string;
    allowDecimal: boolean;
    unit: string;
  } | null>(null);
  const [openRpeSetId, setOpenRpeSetId] = useState<string | null>(null);

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
      // Trigger subtle 30ms haptic feedback impulse on Android / supported devices
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        try {
          navigator.vibrate(30);
        } catch {
          // ignore vibration error
        }
      }
      // Subtle audio click / chime on iOS / Web Audio API
      playChime();
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
            </div>
          </div>
        </div>

        {/* Right Header Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              const currentWeight = log.setLogs?.find(s => s.weight)?.weight || 60;
              setPlateCalcWeight(currentWeight);
              setPlateCalcOpen(true);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 hover:text-emerald-300 text-[11px] font-mono font-bold transition-colors touch-manipulation active:scale-95"
            title="Open Barbell Plate Math Calculator"
          >
            <Calculator className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Plates</span>
          </button>

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

      {/* PREVIOUS SESSION PERFORMANCE CARD */}
      {hasPreviousData && (
        <div className="bg-zinc-950/80 border-b border-zinc-800/80 px-3.5 py-3 sm:px-4 space-y-2.5">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                LAST SESSION
              </span>
              <span className="text-xs text-zinc-400 font-medium truncate">
                {prevPerformance?.lastSessionName || 'Previous Workout'}
              </span>
              {prevPerformance?.lastPerformedAt && (
                <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                  • {getLastSessionTimeAgo(prevPerformance.lastPerformedAt)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleAutofillAll}
              disabled={isAutofilling}
              className="flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-800 px-2.5 py-1 rounded-lg transition-colors"
              title="Autofill current empty sets with previous weights & reps"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isAutofilling ? 'Copying...' : 'Autofill'}</span>
            </button>
          </div>

          {/* Previous Sets Breakdown */}
          {prevPerformance?.sets && prevPerformance.sets.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-0.5">
              {prevPerformance.sets.map((s, idx) => {
                const isWarmup = s.type === 'WARMUP';
                const weightStr =
                  s.weight !== null && s.weight !== undefined ? `${s.weight}kg` : '0kg';
                const repsStr = s.reps !== null && s.reps !== undefined ? `${s.reps}` : '0';

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs font-semibold text-zinc-200 shadow-sm"
                  >
                    <span
                      className={`text-[10px] font-bold ${
                        isWarmup ? 'text-amber-400' : 'text-zinc-500'
                      }`}
                    >
                      {isWarmup ? `W${s.setNumber || idx + 1}:` : `Set ${s.setNumber || idx + 1}:`}
                    </span>
                    <span>
                      {weightStr} × {repsStr}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Previous Note if present */}
          {prevPerformance?.previousNote && (
            <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
                <FileText className="h-3.5 w-3.5 text-amber-400" />
                <span>Note:</span>
              </div>
              <p className="text-xs text-zinc-200 pl-5 leading-relaxed">
                {prevPerformance.previousNote}
              </p>
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
        <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase text-zinc-500 font-semibold px-2 pb-1 items-center">
          <div className="col-span-2 text-center">SET</div>
          <div className="col-span-3 text-center">PREVIOUS</div>
          <div className="col-span-3 text-center flex items-center justify-center gap-1">
            <span>KG</span>
            <button
              type="button"
              onClick={() => {
                const activeSet = log.setLogs?.find(s => !s.completed) || log.setLogs?.[0];
                setPlateCalcWeight(activeSet?.weight || 60);
                setPlateCalcOpen(true);
              }}
              className="text-emerald-500 hover:text-emerald-400 p-0.5 rounded transition-colors"
              title="Barbell Plate Math Calculator"
            >
              <Calculator className="h-3 w-3" />
            </button>
          </div>
          <div className="col-span-3 text-center">REPS</div>
          <div className="col-span-1 text-center">✓</div>
        </div>

        {/* Set Rows (Warmups at the Top, followed by Working sets) */}
        <div className="space-y-1.5">
          {(() => {
            // Find the first uncompleted set to mark as active
            const firstUncompletedId = orderedSets.find(s => !s.completed)?.id;

            return orderedSets.map((set, setIdx) => {
              const isWarmup = set.type === 'WARMUP';
              const isNextActive = set.id === firstUncompletedId;
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
                <div key={set.id} className="space-y-1">
                  <div
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                      set.completed
                        ? 'bg-emerald-950/20 border-emerald-900/60'
                        : isNextActive
                          ? 'bg-zinc-900/95 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-sm'
                          : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    {/* Set Type / Sequence Badge */}
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleSetType(set)}
                        className={`h-8 w-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-transform touch-manipulation active:scale-95 border ${
                          isWarmup
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : isNextActive
                              ? 'bg-zinc-900 text-emerald-300 border-emerald-700 font-extrabold'
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

                      {/* RPE Tag Button */}
                      <button
                        type="button"
                        onClick={() => setOpenRpeSetId(openRpeSetId === set.id ? null : set.id)}
                        className={`px-1 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                          set.rpe
                            ? set.rpe >= 9
                              ? 'bg-red-950 text-red-300 border-red-800'
                              : set.rpe >= 8
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                        title="Set RPE (Rate of Perceived Exertion)"
                      >
                        {set.rpe ? `@${set.rpe}` : 'RPE'}
                      </button>
                    </div>

                    {/* Previous Reference (Clickable to autofill this set) */}
                    <div className="col-span-3 flex justify-center">
                      {previousInfo.hasData ? (
                        <button
                          type="button"
                          onClick={() => handleAutofillSingleSet(set, setIdx)}
                          className="font-mono text-xs text-zinc-400 hover:text-emerald-300 hover:bg-zinc-900 px-2 py-1 rounded-lg transition-colors truncate max-w-full touch-manipulation active:scale-95"
                          title="Tap to copy into current set"
                        >
                          {previousInfo.text}
                        </button>
                      ) : (
                        <span className="font-mono text-xs text-zinc-600">-</span>
                      )}
                    </div>

                    {/* Weight Input (kg/lbs) + Plate Calculator Quick Tap */}
                    <div className="col-span-3 relative flex items-center">
                      <ControlledSetInput
                        value={set.weight}
                        onCommit={val => onUpdateSet(set.id, { weight: val })}
                        parseFn={raw => (raw === '' ? null : parseFloat(raw))}
                        inputMode="decimal"
                        step="0.5"
                        min="0"
                        placeholder="0"
                        className={`w-full h-9 text-center text-sm font-mono font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors touch-manipulation ${
                          set.completed
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                            : isNextActive
                              ? 'bg-zinc-900 border-emerald-600 text-zinc-100'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-emerald-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPlateCalcWeight(set.weight || 60);
                          setPlateCalcOpen(true);
                        }}
                        className="absolute right-1 text-zinc-500 hover:text-emerald-400 p-1 rounded transition-colors"
                        title="Plate Math Barbell Assistant"
                      >
                        <Calculator className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Reps Input */}
                    <div className="col-span-3 relative flex items-center">
                      <ControlledSetInput
                        value={set.reps}
                        onCommit={val => onUpdateSet(set.id, { reps: val })}
                        parseFn={raw => (raw === '' ? null : parseInt(raw, 10))}
                        inputMode="numeric"
                        step="1"
                        min="0"
                        placeholder="0"
                        className={`w-full h-9 text-center text-sm font-mono font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors touch-manipulation ${
                          set.completed
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                            : isNextActive
                              ? 'bg-zinc-900 border-emerald-600 text-zinc-100'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-emerald-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setKeypadTarget({
                            setId: set.id,
                            field: 'reps',
                            initialValue: set.reps ?? null,
                            title: 'Enter Reps',
                            allowDecimal: false,
                            unit: 'reps',
                          })
                        }
                        className="absolute right-1 text-zinc-500 hover:text-emerald-400 p-1 rounded transition-colors hidden sm:block"
                        title="Touch Numpad Keypad"
                      >
                        <Hash className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Completion Checkmark Action */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(set)}
                        className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all touch-manipulation active:scale-90 ${
                          set.completed
                            ? 'bg-emerald-900 text-emerald-100 border border-emerald-600 shadow-md shadow-emerald-950/60 scale-105'
                            : isNextActive
                              ? 'bg-zinc-800 text-zinc-400 border border-emerald-600/70 hover:text-emerald-300 hover:border-emerald-500'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-200 hover:border-zinc-600'
                        }`}
                        title={set.completed ? 'Mark incomplete' : 'Mark completed'}
                      >
                        <Check
                          className={`h-4.5 w-4.5 ${set.completed ? 'stroke-[2.5]' : 'stroke-[2]'}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* RPE Quick Chips Selector Drawer */}
                  {openRpeSetId === set.id && (
                    <div className="flex items-center gap-1.5 p-2 bg-zinc-950/90 border border-zinc-800 rounded-xl overflow-x-auto animate-in slide-in-from-top-1 duration-150">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider shrink-0 px-1">
                        RPE:
                      </span>
                      {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(rpeVal => (
                        <button
                          key={rpeVal}
                          type="button"
                          onClick={async () => {
                            const newRpe = set.rpe === rpeVal ? null : rpeVal;
                            await onUpdateSet(set.id, { rpe: newRpe });
                            setOpenRpeSetId(null);
                          }}
                          className={`px-2 py-1 rounded-lg font-mono text-xs font-bold border shrink-0 transition-all active:scale-95 ${
                            set.rpe === rpeVal
                              ? rpeVal >= 9
                                ? 'bg-red-600 text-white border-red-500'
                                : rpeVal >= 8
                                  ? 'bg-amber-600 text-white border-amber-500'
                                  : 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          @{rpeVal}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* Action Controls: + Working Set, + Warm-up Set, Delete Set */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddSet(log.id, 'WORKING')}
              className="border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-emerald-400 text-xs h-8 px-3 rounded-xl gap-1.5 touch-manipulation active:scale-95"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>Add Set</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddSet(log.id, 'WARMUP')}
              className="border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-amber-300 text-xs h-8 px-2.5 rounded-xl gap-1.5 touch-manipulation active:scale-95"
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
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors p-1.5 touch-manipulation active:scale-95"
              title="Delete Last Set"
            >
              Remove set
            </button>
          )}
        </div>
      </div>

      {/* Ergonomic Modals */}
      <PlateCalculatorModal
        isOpen={plateCalcOpen}
        onClose={() => setPlateCalcOpen(false)}
        initialWeight={plateCalcWeight}
        onApplyWeight={weight => {
          const targetSet = log.setLogs?.find(s => !s.completed) || log.setLogs?.[0];
          if (targetSet) {
            onUpdateSet(targetSet.id, { weight });
          }
        }}
      />

      {keypadTarget && (
        <NumericKeypadModal
          isOpen={Boolean(keypadTarget)}
          onClose={() => setKeypadTarget(null)}
          title={keypadTarget.title}
          allowDecimal={keypadTarget.allowDecimal}
          unit={keypadTarget.unit}
          initialValue={keypadTarget.initialValue}
          onConfirm={val => {
            if (keypadTarget) {
              onUpdateSet(keypadTarget.setId, { [keypadTarget.field]: val });
            }
          }}
        />
      )}
    </div>
  );
}
