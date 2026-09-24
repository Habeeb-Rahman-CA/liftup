'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { exercisesApi } from '@/lib/api-client';
import { ExerciseDialog } from '@/components/exercises/exercise-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dumbbell,
  Plus,
  Search,
  ArrowUpDown,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  FileText,
  Layers,
  History,
} from 'lucide-react';
import { ExerciseHistoryModal } from '@/components/exercises/exercise-history-modal';
import type { ExerciseDto, CreateExercisePayload, UpdateExercisePayload } from '@liftup/types';

export default function ExercisesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [categories, setCategories] = useState<
    { category: string; count: number; activeCount: number }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'orderIndex'>('orderIndex');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExerciseDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [historyModalExercise, setHistoryModalExercise] = useState<ExerciseDto | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [exData, catData] = await Promise.all([
        exercisesApi.getAll({
          category: selectedCategory === 'ALL' ? undefined : selectedCategory,
          search: searchQuery.trim() || undefined,
          isActive: statusFilter === 'all' ? undefined : statusFilter,
          sortBy,
          sortOrder,
        }),
        exercisesApi.getCategories(),
      ]);
      setExercises(exData);
      setCategories(catData);
    } catch (err) {
      setNotification({ type: 'error', message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Clear toast notification after 4s
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleCreateOrUpdate = async (data: CreateExercisePayload | UpdateExercisePayload) => {
    try {
      if (editingExercise) {
        await exercisesApi.update(editingExercise.id, data);
        setNotification({
          type: 'success',
          message: `Exercise "${data.name}" updated successfully.`,
        });
      } else {
        await exercisesApi.create(data as CreateExercisePayload);
        setNotification({ type: 'success', message: `Exercise "${data.name}" added to catalog.` });
      }
      setEditingExercise(null);
      await loadData();
    } catch (err) {
      throw err;
    }
  };

  const handleToggleActive = async (exercise: ExerciseDto) => {
    try {
      setActionLoadingId(exercise.id);
      await exercisesApi.toggleActive(exercise.id);
      const newStatus = !exercise.isActive ? 'activated' : 'deactivated';
      setNotification({ type: 'success', message: `"${exercise.name}" is now ${newStatus}.` });
      await loadData();
    } catch (err) {
      setNotification({ type: 'error', message: (err as Error).message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await exercisesApi.delete(deleteTarget.id);
      setNotification({ type: 'success', message: res.message });
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setNotification({ type: 'error', message: (err as Error).message });
    } finally {
      setIsDeleting(false);
    }
  };

  // Cycle status: All -> Active -> Inactive -> All
  const cycleStatusFilter = () => {
    setStatusFilter(prev => {
      if (prev === 'all') return 'true';
      if (prev === 'true') return 'false';
      return 'all';
    });
  };

  // Cycle sort: Default -> Name (A-Z) -> Category -> Default
  const cycleSort = () => {
    setSortBy(prev => {
      if (prev === 'orderIndex') return 'name';
      if (prev === 'name') return 'category';
      return 'orderIndex';
    });
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-500">Loading exercise catalog...</p>
        </div>
      </div>
    );
  }

  const totalCount = categories.reduce((acc, c) => acc + c.count, 0);

  return (
    <main className="flex-1 p-3.5 sm:p-8 max-w-4xl mx-auto w-full space-y-4 sm:space-y-5 pb-24 md:pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-16 right-4 left-4 sm:left-auto sm:w-96 z-50 p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all animate-in slide-in-from-top-3 ${
            notification.type === 'success'
              ? 'bg-zinc-900 border-emerald-800 text-emerald-300'
              : 'bg-zinc-900 border-red-900 text-red-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 text-red-400" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-zinc-500 hover:text-zinc-300 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
            <Dumbbell className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
              Exercise Library
            </h1>
            <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px] font-mono px-1.5 py-0">
              {totalCount || exercises.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Compact Search & Filter Toolbar */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-7 h-9 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Single-Click Cycling Status Button (All → Active → Inactive → All) */}
          <button
            type="button"
            onClick={cycleStatusFilter}
            className={`h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors select-none ${
              statusFilter === 'true'
                ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                : statusFilter === 'false'
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-850'
            }`}
            title="Click to cycle status filter (All → Active → Inactive)"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                statusFilter === 'true'
                  ? 'bg-emerald-400'
                  : statusFilter === 'false'
                    ? 'bg-zinc-500'
                    : 'bg-emerald-500/50'
              }`}
            />
            <span>
              {statusFilter === 'true' ? 'Active' : statusFilter === 'false' ? 'Inactive' : 'All'}
            </span>
          </button>

          {/* Minimal Single-Click Sort Toggle */}
          <button
            type="button"
            onClick={cycleSort}
            className="h-9 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors select-none"
            title="Click to cycle sort (Default → Name → Category)"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline text-zinc-400 text-[11px]">Sort:</span>
            <span className="text-zinc-200">
              {sortBy === 'orderIndex' ? 'Default' : sortBy === 'name' ? 'A-Z' : 'Category'}
            </span>
          </button>
        </div>

        {/* Horizontal Category Scroll Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-medium border shrink-0 transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({totalCount})
          </button>
          {categories.map(cat => (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`px-3 py-1 rounded-xl text-xs font-medium border shrink-0 transition-colors ${
                selectedCategory === cat.category
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.category} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Master List (Clean, without reorder clutter) */}
      <div className="space-y-2">
        {loading ? (
          <div className="p-10 text-center space-y-3 bg-zinc-900/50 rounded-2xl border border-zinc-800/80">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
            <p className="text-xs text-zinc-400">Loading exercise library...</p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="p-10 text-center space-y-3 bg-zinc-900/40 rounded-2xl border border-zinc-800/60">
            <SlidersHorizontal className="h-7 w-7 mx-auto text-zinc-600" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-300">No exercises found</h3>
              <p className="text-xs text-zinc-500">
                {searchQuery || selectedCategory !== 'ALL' || statusFilter !== 'all'
                  ? 'Try clearing or modifying your filter criteria.'
                  : 'Get started by creating your first exercise.'}
              </p>
            </div>
            {(searchQuery || selectedCategory !== 'ALL' || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setStatusFilter('all');
                }}
                className="border-zinc-800 bg-zinc-900 text-zinc-300 text-xs h-8"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          exercises.map(exercise => {
            const isProcessing = actionLoadingId === exercise.id;
            const isExpanded = expandedId === exercise.id;

            return (
              <div
                key={exercise.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  exercise.isActive
                    ? isExpanded
                      ? 'bg-zinc-900 border-zinc-700'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-750'
                    : 'bg-zinc-950/60 border-zinc-900 opacity-60'
                }`}
              >
                {/* Main Card Header Row (Click to Expand / Collapse) */}
                <div
                  onClick={() => setExpandedId(prev => (prev === exercise.id ? null : exercise.id))}
                  className="flex items-center justify-between gap-3 p-3.5 sm:p-4 cursor-pointer select-none"
                >
                  {/* Exercise Details Summary */}
                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-zinc-100 truncate">
                        {exercise.name}
                      </h3>
                      <Badge className="bg-zinc-950 text-emerald-400 border-zinc-800 text-[10px] font-medium uppercase px-2 py-0">
                        {exercise.category}
                      </Badge>
                      {!exercise.isActive && (
                        <Badge
                          variant="outline"
                          className="border-zinc-800 text-zinc-500 text-[10px] px-1.5 py-0"
                        >
                          Inactive
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                      <span className="font-mono text-[11px] text-zinc-300">
                        {exercise.defaultSets ?? 3} Sets × {exercise.defaultRepsMin ?? 8}-
                        {exercise.defaultRepsMax ?? 12} Reps
                      </span>
                      {exercise.description && (
                        <>
                          <span className="text-zinc-600 hidden sm:inline">•</span>
                          <span className="text-[11px] text-zinc-500 truncate max-w-xs sm:max-w-md hidden sm:inline">
                            {exercise.description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Action Controls & Expand Indicator */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Quick Toggle Active Switch */}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleToggleActive(exercise)}
                      className={`h-8 px-2 text-xs rounded-lg transition-colors ${
                        exercise.isActive
                          ? 'text-emerald-400 hover:bg-emerald-950/60'
                          : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                      }`}
                      title={exercise.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : exercise.isActive ? (
                        <div className="flex items-center gap-1.5 font-medium">
                          <ToggleRight className="h-5 w-5 text-emerald-400" />
                          <span className="hidden sm:inline text-[11px]">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-medium">
                          <ToggleLeft className="h-5 w-5 text-zinc-500" />
                          <span className="hidden sm:inline text-[11px]">Inactive</span>
                        </div>
                      )}
                    </Button>

                    {/* History & PRs */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHistoryModalExercise(exercise)}
                      className="h-8 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-lg text-xs"
                      title="View Performance History & PRs"
                    >
                      <History className="h-3.5 w-3.5" />
                    </Button>

                    {/* Edit */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingExercise(exercise);
                        setDialogOpen(true);
                      }}
                      className="h-8 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg text-xs"
                      title="Edit Exercise"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    {/* Delete / Archive */}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => setDeleteTarget(exercise)}
                      className="h-8 px-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg text-xs"
                      title="Delete or Archive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                    {/* Expand Indicator Chevron */}
                    <div
                      onClick={() =>
                        setExpandedId(prev => (prev === exercise.id ? null : exercise.id))
                      }
                      className="p-1 text-zinc-500 hover:text-zinc-300 transition-transform duration-200 cursor-pointer"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-emerald-400' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expandable Smooth Detail Drawer */}
                {isExpanded && (
                  <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-3 border-t border-zinc-800/80 bg-zinc-950/60 space-y-2.5 animate-in fade-in-50 duration-150">
                    {/* Instructions / Form Cues */}
                    {exercise.instructions ? (
                      <div className="space-y-1 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span>Form Cues & Execution Notes</span>
                        </div>
                        <p className="text-zinc-300 text-[11px] leading-relaxed pl-5">
                          {exercise.instructions}
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-500 italic px-1">
                        No specific form cues recorded for this exercise yet.
                      </div>
                    )}

                    {/* Description & Equipment Details */}
                    {exercise.description && (
                      <div className="text-xs text-zinc-400 px-1">
                        <span className="text-zinc-500 font-medium">Equipment / Overview: </span>
                        <span>{exercise.description}</span>
                      </div>
                    )}

                    {/* Specs Summary Pill Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block">Default Sets</span>
                        <span className="text-xs font-semibold text-zinc-200 font-mono">
                          {exercise.defaultSets ?? 3} Working Sets
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block">Target Rep Range</span>
                        <span className="text-xs font-semibold text-zinc-200 font-mono">
                          {exercise.defaultRepsMin ?? 8} – {exercise.defaultRepsMax ?? 12} Reps
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block">Primary Target</span>
                        <span className="text-xs font-semibold text-emerald-400 uppercase">
                          {exercise.category}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block">Catalog Status</span>
                        <span
                          className={`text-xs font-semibold ${
                            exercise.isActive ? 'text-emerald-400' : 'text-zinc-500'
                          }`}
                        >
                          {exercise.isActive ? 'Active (Selectable)' : 'Deactivated'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Dialog */}
      <ExerciseDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingExercise(null);
        }}
        onSave={handleCreateOrUpdate}
        exerciseToEdit={editingExercise}
        existingCategories={categories.map(c => c.category)}
      />

      {/* Delete / Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Exercise"
        description={
          deleteTarget ? (
            <div className="space-y-2">
              <p>
                Are you sure you want to delete{' '}
                <strong className="text-zinc-100 font-semibold">
                  &quot;{deleteTarget.name}&quot;
                </strong>{' '}
                ({deleteTarget.category})?
              </p>
              <p className="text-[11px] text-zinc-400">
                If this exercise is linked to past workout session logs, it will be safely
                deactivated to preserve your historical logs.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Delete Exercise"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={executeDelete}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />

      {/* Exercise Progression / History Modal */}
      <ExerciseHistoryModal
        isOpen={Boolean(historyModalExercise)}
        onClose={() => setHistoryModalExercise(null)}
        exerciseId={historyModalExercise?.id || null}
        exerciseName={historyModalExercise?.name}
        category={historyModalExercise?.category}
      />

      {/* Floating Action Button (FAB) at Bottom Right */}
      <button
        type="button"
        onClick={() => {
          setEditingExercise(null);
          setDialogOpen(true);
        }}
        aria-label="Add new exercise"
        className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 z-40 h-13 w-13 rounded-full bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 flex items-center justify-center transition-transform active:scale-95 touch-manipulation cursor-pointer shadow-none"
      >
        <Plus className="h-6 w-6" />
      </button>
    </main>
  );
}
