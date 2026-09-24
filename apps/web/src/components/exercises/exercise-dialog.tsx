'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2, Dumbbell, Sparkles } from 'lucide-react';
import type { ExerciseDto, CreateExercisePayload, UpdateExercisePayload } from '@liftup/types';

interface ExerciseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (_data: CreateExercisePayload | UpdateExercisePayload) => Promise<void>;
  exerciseToEdit?: ExerciseDto | null;
  existingCategories?: string[];
}

const DEFAULT_CATEGORIES = [
  'CHEST',
  'BACK',
  'SHOULDERS',
  'LEGS',
  'ARMS',
  'CORE',
  'CARDIO',
  'OTHER',
];

export function ExerciseDialog({
  isOpen,
  onClose,
  onSave,
  exerciseToEdit,
  existingCategories = [],
}: ExerciseDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('CHEST');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [defaultSets, setDefaultSets] = useState(3);
  const [defaultRepsMin, setDefaultRepsMin] = useState(8);
  const [defaultRepsMax, setDefaultRepsMax] = useState(12);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...existingCategories.map(c => c.toUpperCase())]),
  );

  useEffect(() => {
    if (exerciseToEdit) {
      setName(exerciseToEdit.name);
      if (allCategories.includes(exerciseToEdit.category.toUpperCase())) {
        setCategory(exerciseToEdit.category.toUpperCase());
        setCustomCategory('');
      } else {
        setCategory('CUSTOM');
        setCustomCategory(exerciseToEdit.category);
      }
      setDescription(exerciseToEdit.description || '');
      setInstructions(exerciseToEdit.instructions || '');
      setDefaultSets(exerciseToEdit.defaultSets ?? 3);
      setDefaultRepsMin(exerciseToEdit.defaultRepsMin ?? 8);
      setDefaultRepsMax(exerciseToEdit.defaultRepsMax ?? 12);
    } else {
      setName('');
      setCategory('CHEST');
      setCustomCategory('');
      setDescription('');
      setInstructions('');
      setDefaultSets(3);
      setDefaultRepsMin(8);
      setDefaultRepsMax(12);
    }
    setError(null);
  }, [exerciseToEdit, isOpen]);

  // Robust scroll-lock preventing background scroll while modal is active
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalName = name.trim();
    if (!finalName) {
      setError('Exercise name is required.');
      return;
    }

    const finalCategory = (category === 'CUSTOM' ? customCategory.trim() : category).toUpperCase();
    if (!finalCategory) {
      setError('Category is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: finalName,
        category: finalCategory,
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        defaultSets: Number(defaultSets) || 3,
        defaultRepsMin: Number(defaultRepsMin) || 8,
        defaultRepsMax: Number(defaultRepsMax) || 12,
        ...(exerciseToEdit && { isActive: exerciseToEdit.isActive }),
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 overscroll-none touch-none"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 touch-auto"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">
                {exerciseToEdit ? 'Edit Exercise' : 'New Exercise'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {exerciseToEdit
                  ? 'Update default parameters and details'
                  : 'Add to your master exercise catalog'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain"
        >
          {error && (
            <div className="p-3 rounded-xl border border-red-900/60 bg-zinc-900 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-1.5">
            <Label htmlFor="ex-name" className="text-xs font-medium text-zinc-300">
              Exercise Name <span className="text-emerald-400">*</span>
            </Label>
            <Input
              id="ex-name"
              type="text"
              required
              placeholder="e.g. Incline Dumbbell Press"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-10 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-emerald-700 text-xs sm:text-sm"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-300">
              Target Muscle Category <span className="text-emerald-400">*</span>
            </Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    category === cat
                      ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategory('CUSTOM')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  category === 'CUSTOM'
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                + Custom
              </button>
            </div>

            {category === 'CUSTOM' && (
              <Input
                type="text"
                placeholder="Enter custom category name (e.g. FOREARMS)"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="mt-2 h-9 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs"
              />
            )}
          </div>

          {/* Defaults Grid: Sets, Reps Min, Reps Max */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="space-y-1">
              <Label htmlFor="ex-sets" className="text-[11px] font-medium text-zinc-400">
                Default Sets
              </Label>
              <Input
                id="ex-sets"
                type="number"
                min="1"
                max="20"
                value={defaultSets}
                onChange={e => setDefaultSets(parseInt(e.target.value) || 1)}
                className="h-9 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 text-center text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ex-reps-min" className="text-[11px] font-medium text-zinc-400">
                Reps (Min)
              </Label>
              <Input
                id="ex-reps-min"
                type="number"
                min="1"
                max="200"
                value={defaultRepsMin}
                onChange={e => setDefaultRepsMin(parseInt(e.target.value) || 1)}
                className="h-9 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 text-center text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ex-reps-max" className="text-[11px] font-medium text-zinc-400">
                Reps (Max)
              </Label>
              <Input
                id="ex-reps-max"
                type="number"
                min="1"
                max="200"
                value={defaultRepsMax}
                onChange={e => setDefaultRepsMax(parseInt(e.target.value) || 1)}
                className="h-9 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 text-center text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ex-desc" className="text-xs font-medium text-zinc-300">
              Description / Equipment
            </Label>
            <Input
              id="ex-desc"
              type="text"
              placeholder="e.g. Free weight dumbbell incline bench"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="h-9 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs"
            />
          </div>

          {/* Instructions / Form Cues */}
          <div className="space-y-1.5">
            <Label htmlFor="ex-instructions" className="text-xs font-medium text-zinc-300">
              Form Cues & Execution Notes
            </Label>
            <textarea
              id="ex-instructions"
              rows={3}
              placeholder="e.g. Set bench to 30 degrees, retract scapula, press with full control..."
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-none"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/60 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 mt-4 flex items-center justify-end gap-2.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs h-9 px-3.5 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-9 px-4 rounded-xl font-medium gap-1.5 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{exerciseToEdit ? 'Save Changes' : 'Create Exercise'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
