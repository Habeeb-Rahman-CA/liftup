'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search, Plus, Loader2, Check, Dumbbell } from 'lucide-react';
import { exercisesApi } from '@/lib/api-client';
import type { ExerciseDto } from '@liftup/types';

interface AddSessionExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (exerciseId: string) => Promise<void>;
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

export function AddSessionExerciseModal({
  isOpen,
  onClose,
  onAddExercise,
}: AddSessionExerciseModalProps) {
  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  // Derive categories list dynamically
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

  // Load exercises on open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);
    setError(null);
    setSearchTerm('');
    setSelectedCategory('ALL');

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

  const handlePick = async (exerciseId: string) => {
    try {
      setSubmittingId(exerciseId);
      await onAddExercise(exerciseId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add exercise');
    } finally {
      setSubmittingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-safe bg-black/80 overscroll-none touch-none animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget && !submittingId) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md modal-safe-bounds flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 touch-auto"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-400" />
              Add Exercise to Session
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Select an exercise to add to your current workout
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-3 sm:p-4 space-y-2.5 border-b border-zinc-800/80 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <Input
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search exercises..."
              className="pl-8 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs h-9 rounded-xl focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
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

        {/* Exercises List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 min-h-[250px]">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-900/80 text-red-300 text-xs">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-xs">
              No exercises found matching your search.
            </div>
          ) : (
            filteredExercises.map(ex => (
              <div
                key={ex.id}
                onClick={() => !submittingId && handlePick(ex.id)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-emerald-700 hover:bg-zinc-900 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 group-hover:text-emerald-400 shrink-0">
                    <Dumbbell className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-xs text-zinc-100 truncate group-hover:text-emerald-300">
                      {ex.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                      {ex.category}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  disabled={submittingId === ex.id}
                  className="bg-zinc-800 hover:bg-emerald-900 text-zinc-300 hover:text-emerald-200 border border-zinc-700 text-[11px] h-7 px-2.5 rounded-lg"
                >
                  {submittingId === ex.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
