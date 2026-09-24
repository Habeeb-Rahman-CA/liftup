'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Search,
  Plus,
  Loader2,
  Check,
  Dumbbell,
  Layers,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { exercisesApi } from '@/lib/api-client';
import type { ExerciseDto, AssignExercisePayload } from '@liftup/types';

interface StagedExercise {
  exercise: ExerciseDto;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  note?: string;
}

interface AssignExerciseModalProps {
  isOpen: boolean;
  dayName: string;
  dayOfWeek: number;
  onClose: () => void;
  onAssign: (payloads: AssignExercisePayload[]) => Promise<void>;
}

const DEFAULT_CATEGORIES = [
  'ALL',
  'CHEST',
  'BACK',
  'SHOULDERS',
  'LEGS',
  'ARMS',
  'CORE',
  'CARDIO',
  'OTHER',
] as const;

export function AssignExerciseModal({
  isOpen,
  dayName,
  onClose,
  onAssign,
}: AssignExerciseModalProps) {
  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Dynamically derive category pills from default list + any custom categories present in fetched exercises
  const categoriesList = useMemo(() => {
    const list: string[] = [...DEFAULT_CATEGORIES];
    exercises.forEach(ex => {
      const cat = ex.category?.toUpperCase();
      if (cat && !list.includes(cat)) {
        list.push(cat);
      }
    });
    return list;
  }, [exercises]);

  // Staged multi-selection map: exerciseId -> StagedExercise
  const [stagedMap, setStagedMap] = useState<Map<string, StagedExercise>>(new Map());

  // Currently active/configuring exercise ID (open accordion)
  const [activeConfiguringId, setActiveConfiguringId] = useState<string | null>(null);

  // Form Fields for actively configuring exercise
  const [targetSets, setTargetSets] = useState<number>(3);
  const [targetRepsMin, setTargetRepsMin] = useState<number>(8);
  const [targetRepsMax, setTargetRepsMax] = useState<number>(12);
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, submitting, onClose]);

  // Fetch exercises catalog
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);
    setError(null);
    setStagedMap(new Map());
    setActiveConfiguringId(null);

    exercisesApi
      .getAll({ isActive: true, sortBy: 'name', sortOrder: 'asc' })
      .then(data => {
        if (isMounted) {
          setExercises(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'Failed to load exercises');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // When clicking an exercise in catalog
  const handleToggleConfigure = (exercise: ExerciseDto) => {
    if (activeConfiguringId === exercise.id) {
      // Collapse
      setActiveConfiguringId(null);
      return;
    }

    setActiveConfiguringId(exercise.id);

    // If already staged, prefill staged values; otherwise prefill exercise defaults
    const existing = stagedMap.get(exercise.id);
    if (existing) {
      setTargetSets(existing.targetSets);
      setTargetRepsMin(existing.targetRepsMin);
      setTargetRepsMax(existing.targetRepsMax);
      setNote(existing.note || '');
    } else {
      setTargetSets(exercise.defaultSets || 3);
      setTargetRepsMin(exercise.defaultRepsMin || 8);
      setTargetRepsMax(exercise.defaultRepsMax || 12);
      setNote('');
    }
  };

  // Stage the configured exercise
  const handleStageExercise = (exercise: ExerciseDto) => {
    setStagedMap(prev => {
      const next = new Map(prev);
      next.set(exercise.id, {
        exercise,
        targetSets: Number(targetSets) || 3,
        targetRepsMin: Number(targetRepsMin) || 8,
        targetRepsMax: Number(targetRepsMax) || 12,
        note: note.trim() || undefined,
      });
      return next;
    });

    // Close configuring drawer so user can pick next
    setActiveConfiguringId(null);
  };

  // Unstage an exercise
  const handleUnstageExercise = (exerciseId: string) => {
    setStagedMap(prev => {
      const next = new Map(prev);
      next.delete(exerciseId);
      return next;
    });
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesCategory =
        selectedCategory === 'ALL' || ex.category.toUpperCase() === selectedCategory.toUpperCase();
      const matchesSearch =
        ex.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        ex.category.toLowerCase().includes(searchTerm.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [exercises, selectedCategory, searchTerm]);

  const stagedList = useMemo(() => {
    return Array.from(stagedMap.values());
  }, [stagedMap]);

  // Submit all staged exercises at once
  const handleSubmitBatch = async () => {
    if (stagedList.length === 0) {
      setError('Please select at least one exercise');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payloads: AssignExercisePayload[] = stagedList.map(item => ({
        exerciseId: item.exercise.id,
        targetSets: item.targetSets,
        targetRepsMin: item.targetRepsMin,
        targetRepsMax: item.targetRepsMax,
        note: item.note,
      }));

      await onAssign(payloads);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign exercises');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overscroll-none touch-none animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 touch-auto"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">
                Add Exercises to {dayName}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Select and configure multiple movements to add at once
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-900/80 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Staged Exercises Counter & Chip Strip (fixed height, horizontal side-scroll) */}
          {stagedList.length > 0 && (
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/70 space-y-1.5 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Selected to Add ({stagedList.length})
                </span>
                <button
                  type="button"
                  onClick={() => setStagedMap(new Map())}
                  className="text-[10px] text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              </div>

              {/* Fixed single-row horizontal scroll strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {stagedList.map(item => (
                  <span
                    key={item.exercise.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-800 text-emerald-200 text-[11px] shrink-0 whitespace-nowrap"
                  >
                    <span className="font-medium truncate max-w-[140px]">{item.exercise.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      ({item.targetSets}×{item.targetRepsMin}-{item.targetRepsMax})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUnstageExercise(item.exercise.id)}
                      className="text-emerald-400 hover:text-red-300 ml-0.5"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search and Category Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <Input
                type="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search exercise catalog..."
                className="pl-8 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs h-9 rounded-xl focus:border-emerald-600"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise List Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400 block">
              Exercise Catalog ({filteredExercises.length}) • Click an exercise to configure sets
              &amp; reps
            </label>

            {loading ? (
              <div className="flex items-center justify-center p-8 bg-zinc-900/40 rounded-xl border border-zinc-800/80">
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  <span>Loading catalog...</span>
                </div>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="p-6 text-center bg-zinc-900/40 rounded-xl border border-zinc-800/80 text-zinc-500 text-xs">
                No exercises found matching your search.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {filteredExercises.map(ex => {
                  const isStaged = stagedMap.has(ex.id);
                  const isConfiguring = activeConfiguringId === ex.id;
                  const stagedData = stagedMap.get(ex.id);

                  return (
                    <div
                      key={ex.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isStaged
                          ? 'bg-emerald-950/30 border-emerald-800/80'
                          : isConfiguring
                            ? 'bg-zinc-900 border-zinc-700'
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {/* Exercise Header Card */}
                      <div
                        onClick={() => handleToggleConfigure(ex)}
                        className="flex items-center justify-between p-2.5 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 border ${
                              isStaged
                                ? 'bg-emerald-900 border-emerald-600 text-emerald-200'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}
                          >
                            {isStaged ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Dumbbell className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs text-zinc-100 truncate">{ex.name}</p>
                            <p className="text-[10px] text-zinc-400">
                              {ex.category} • Default {ex.defaultSets || 3} sets ×{' '}
                              {ex.defaultRepsMin || 8}-{ex.defaultRepsMax || 12} reps
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isStaged ? (
                            <Badge className="bg-emerald-900 text-emerald-200 border-emerald-700 text-[10px] font-mono">
                              {stagedData?.targetSets} × {stagedData?.targetRepsMin}-
                              {stagedData?.targetRepsMax}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-zinc-800 bg-zinc-950 text-zinc-400 text-[10px] font-normal"
                            >
                              {ex.category}
                            </Badge>
                          )}

                          <button type="button" className="text-zinc-500 hover:text-zinc-300 p-0.5">
                            {isConfiguring ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Parameters Drawer */}
                      {isConfiguring && (
                        <div
                          className="border-t border-zinc-800/80 bg-zinc-950/90 p-3 space-y-3 animate-in fade-in duration-100"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                              <Layers className="h-3.5 w-3.5" />
                              Set Target Sets &amp; Reps for {ex.name}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2.5">
                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-1">
                                Target Sets
                              </label>
                              <Input
                                type="number"
                                min="1"
                                max="20"
                                value={targetSets}
                                onChange={e =>
                                  setTargetSets(Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-8 rounded-lg text-center focus:border-emerald-600"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-1">
                                Min Reps
                              </label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={targetRepsMin}
                                onChange={e =>
                                  setTargetRepsMin(Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-8 rounded-lg text-center focus:border-emerald-600"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-1">
                                Max Reps
                              </label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={targetRepsMax}
                                onChange={e =>
                                  setTargetRepsMax(Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-8 rounded-lg text-center focus:border-emerald-600"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-zinc-400 block mb-1 flex items-center gap-1">
                              <FileText className="h-3 w-3 text-zinc-500" />
                              Custom Cue / Notes (optional)
                            </label>
                            <Input
                              type="text"
                              value={note}
                              onChange={e => setNote(e.target.value)}
                              placeholder="e.g. Pause 2s at bottom, explosive concentric"
                              className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs h-8 rounded-lg focus:border-emerald-600"
                            />
                          </div>

                          {/* Action inside drawer */}
                          <div className="flex items-center justify-between pt-1">
                            {isStaged ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnstageExercise(ex.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-950/50 text-xs h-7 px-2 rounded-lg gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Remove</span>
                              </Button>
                            ) : (
                              <div />
                            )}

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleStageExercise(ex)}
                              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-7 px-3 rounded-lg font-medium gap-1"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>{isStaged ? 'Update Selection' : 'Select Exercise'}</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Batch Add CTA */}
        <div className="p-3.5 sm:p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={submitting}
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs h-9 px-3.5 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={submitting || stagedList.length === 0}
              onClick={handleSubmitBatch}
              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-9 px-4 rounded-xl font-medium gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>
                    Add {stagedList.length > 0 ? `${stagedList.length} to ` : 'to '}
                    {dayName}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
