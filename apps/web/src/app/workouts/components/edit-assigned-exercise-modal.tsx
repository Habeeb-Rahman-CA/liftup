'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Loader2, Check, Dumbbell, Layers, FileText } from 'lucide-react';
import type { WorkoutDayExerciseDto, UpdateAssignedExercisePayload } from '@liftup/types';

interface EditAssignedExerciseModalProps {
  isOpen: boolean;
  assignedExercise: WorkoutDayExerciseDto | null;
  dayName: string;
  onClose: () => void;
  onSave: (assignedId: string, payload: UpdateAssignedExercisePayload) => Promise<void>;
}

export function EditAssignedExerciseModal({
  isOpen,
  assignedExercise,
  dayName,
  onClose,
  onSave,
}: EditAssignedExerciseModalProps) {
  const [targetSets, setTargetSets] = useState<number>(3);
  const [targetRepsMin, setTargetRepsMin] = useState<number>(8);
  const [targetRepsMax, setTargetRepsMax] = useState<number>(12);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize values
  useEffect(() => {
    if (assignedExercise) {
      setTargetSets(assignedExercise.targetSets || 3);
      setTargetRepsMin(assignedExercise.targetRepsMin || 8);
      setTargetRepsMax(assignedExercise.targetRepsMax || 12);
      setNote(assignedExercise.note || '');
      setError(null);
    }
  }, [assignedExercise]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedExercise) return;

    try {
      setSubmitting(true);
      setError(null);
      await onSave(assignedExercise.id, {
        targetSets: Number(targetSets) || 3,
        targetRepsMin: Number(targetRepsMin) || 8,
        targetRepsMax: Number(targetRepsMax) || 12,
        note: note.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update assigned exercise');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !assignedExercise) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overscroll-none touch-none animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 touch-auto"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">
                Edit Target Parameters
              </h2>
              <p className="text-[11px] text-zinc-400">
                {assignedExercise.exercise?.name || 'Exercise'} •{' '}
                <span className="text-emerald-400">{dayName}</span>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-900/80 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Exercise Info Card */}
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="font-semibold text-zinc-100 text-xs">
                {assignedExercise.exercise?.name}
              </p>
              <p className="text-[10px] text-zinc-500">
                {assignedExercise.exercise?.description || 'Catalog movement'}
              </p>
            </div>
            {assignedExercise.exercise?.category && (
              <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px] font-normal">
                {assignedExercise.exercise.category}
              </Badge>
            )}
          </div>

          {/* Sets and Reps */}
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <Layers className="h-3.5 w-3.5" />
              <span>Target Sets & Reps</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Target Sets</label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={targetSets}
                  onChange={e => setTargetSets(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-8 rounded-lg text-center focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Min Reps</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={targetRepsMin}
                  onChange={e => setTargetRepsMin(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-8 rounded-lg text-center focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Max Reps</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={targetRepsMax}
                  onChange={e => setTargetRepsMax(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-8 rounded-lg text-center focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 block mb-1 flex items-center gap-1">
                <FileText className="h-3 w-3 text-zinc-500" />
                Target Notes / Coaching Cue (optional)
              </label>
              <Input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Focus on chest stretch, slow tempo"
                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs h-8 rounded-lg focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
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
              type="submit"
              disabled={submitting}
              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-9 px-4 rounded-xl font-medium gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
