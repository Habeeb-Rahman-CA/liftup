'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { exercisesApi, foodsApi } from '@/lib/api-client';
import { ExerciseDialog } from '@/components/exercises/exercise-dialog';
import { CreateFoodModal } from '../foods/components/create-food-modal';
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
  ChevronDown,
  ChevronRight,
  FileText,
  SlidersHorizontal,
  Apple,
  Layers,
  Flame,
  Scale,
  Sparkles,
} from 'lucide-react';
import { ExerciseHistoryInline } from '@/components/exercises/exercise-history-inline';
import type {
  ExerciseDto,
  CreateExercisePayload,
  UpdateExercisePayload,
  FoodDto,
  FoodCategoryStatsDto,
  CreateFoodDto,
  UpdateFoodDto,
} from '@liftup/types';

type LibraryTab = 'EXERCISES' | 'FOODS';

function LibraryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Tab State: EXERCISES vs FOODS
  const initialTab = searchParams.get('tab') === 'foods' ? 'FOODS' : 'EXERCISES';
  const [activeTab, setActiveTab] = useState<LibraryTab>(initialTab);

  // ---------------------------------------------------------------------------
  // EXERCISES STATE
  // ---------------------------------------------------------------------------
  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [exerciseCategories, setExerciseCategories] = useState<
    { category: string; count: number; activeCount: number }[]
  >([]);
  const [selectedExCategory, setSelectedExCategory] = useState('ALL');
  const [exSearchQuery, setExSearchQuery] = useState('');
  const [exSortBy, setExSortBy] = useState<'name' | 'category' | 'orderIndex'>('orderIndex');
  const [exSortOrder, setExSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedExId, setExpandedExId] = useState<string | null>(null);
  const [loadingExercises, setLoadingExercises] = useState(true);

  // Exercise Modals
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseDto | null>(null);
  const [deleteExerciseTarget, setDeleteExerciseTarget] = useState<ExerciseDto | null>(null);
  const [isDeletingExercise, setIsDeletingExercise] = useState(false);

  // ---------------------------------------------------------------------------
  // FOODS STATE
  // ---------------------------------------------------------------------------
  const [foods, setFoods] = useState<FoodDto[]>([]);
  const [foodCategories, setFoodCategories] = useState<FoodCategoryStatsDto[]>([]);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string>('ALL');
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodSortBy, setFoodSortBy] = useState<
    'orderIndex' | 'name' | 'calories' | 'protein' | 'carbs' | 'fat'
  >('orderIndex');
  const [foodSortOrder, setFoodSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedFoodId, setExpandedFoodId] = useState<string | null>(null);
  const [loadingFoods, setLoadingFoods] = useState(true);

  // Food Modals
  const [createFoodModalOpen, setCreateFoodModalOpen] = useState(false);
  const [foodToEdit, setFoodToEdit] = useState<FoodDto | null>(null);
  const [deleteFoodTarget, setDeleteFoodTarget] = useState<FoodDto | null>(null);
  const [isDeletingFood, setIsDeletingFood] = useState(false);

  // Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // EXERCISES DATA LOADER
  // ---------------------------------------------------------------------------
  const loadExerciseData = useCallback(async () => {
    try {
      setLoadingExercises(true);
      const [exData, catData] = await Promise.all([
        exercisesApi.getAll({
          category: selectedExCategory === 'ALL' ? undefined : selectedExCategory,
          search: exSearchQuery.trim() || undefined,
          sortBy: exSortBy,
          sortOrder: exSortOrder,
        }),
        exercisesApi.getCategories(),
      ]);
      setExercises(exData);
      setExerciseCategories(catData);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoadingExercises(false);
    }
  }, [selectedExCategory, exSearchQuery, exSortBy, exSortOrder]);

  // ---------------------------------------------------------------------------
  // FOODS DATA LOADER
  // ---------------------------------------------------------------------------
  const loadFoodData = useCallback(async () => {
    try {
      setLoadingFoods(true);
      const [foodsData, catsData] = await Promise.all([
        foodsApi.getAll({
          category: selectedFoodCategory !== 'ALL' ? selectedFoodCategory : undefined,
          search: foodSearchQuery.trim() || undefined,
          sortBy: foodSortBy,
          sortOrder: foodSortOrder,
        }),
        foodsApi.getCategories(),
      ]);
      setFoods(foodsData);
      setFoodCategories(catsData);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoadingFoods(false);
    }
  }, [selectedFoodCategory, foodSearchQuery, foodSortBy, foodSortOrder]);

  // Initial fetch for categories to ensure tab badges display accurate counts immediately
  useEffect(() => {
    if (user) {
      Promise.all([
        exercisesApi.getCategories().catch(() => []),
        foodsApi.getCategories().catch(() => []),
      ]).then(([exCats, foodCats]) => {
        if (exCats.length > 0) setExerciseCategories(exCats);
        if (foodCats.length > 0) setFoodCategories(foodCats);
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'EXERCISES') {
        loadExerciseData();
      } else {
        loadFoodData();
      }
    }
  }, [user, activeTab, loadExerciseData, loadFoodData]);

  // ---------------------------------------------------------------------------
  // EXERCISE HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreateOrUpdateExercise = async (
    data: CreateExercisePayload | UpdateExercisePayload,
  ) => {
    try {
      if (editingExercise) {
        await exercisesApi.update(editingExercise.id, data);
        showToast(`Exercise "${data.name}" updated successfully.`);
      } else {
        await exercisesApi.create(data as CreateExercisePayload);
        showToast(`Exercise "${data.name}" added to library.`);
      }
      setEditingExercise(null);
      await loadExerciseData();
    } catch (err) {
      throw err;
    }
  };

  const executeDeleteExercise = async () => {
    if (!deleteExerciseTarget) return;
    try {
      setIsDeletingExercise(true);
      const res = await exercisesApi.delete(deleteExerciseTarget.id);
      showToast(res.message);
      setDeleteExerciseTarget(null);
      await loadExerciseData();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setIsDeletingExercise(false);
    }
  };

  const cycleExSort = () => {
    setExSortBy(prev => {
      if (prev === 'orderIndex') return 'name';
      if (prev === 'name') return 'category';
      return 'orderIndex';
    });
  };

  // ---------------------------------------------------------------------------
  // FOOD HANDLERS
  // ---------------------------------------------------------------------------
  const handleSaveFood = async (data: CreateFoodDto | UpdateFoodDto) => {
    if (foodToEdit) {
      await foodsApi.update(foodToEdit.id, data as UpdateFoodDto);
      showToast(`Updated "${data.name || foodToEdit.name}"`);
    } else {
      await foodsApi.create(data as CreateFoodDto);
      showToast(`Added "${data.name}" to food library`);
    }
    setFoodToEdit(null);
    await loadFoodData();
  };

  const executeDeleteFood = async () => {
    if (!deleteFoodTarget) return;
    try {
      setIsDeletingFood(true);
      await foodsApi.delete(deleteFoodTarget.id);
      showToast(`Deleted "${deleteFoodTarget.name}"`);
      setDeleteFoodTarget(null);
      setExpandedFoodId(null);
      await loadFoodData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete food item', 'error');
    } finally {
      setIsDeletingFood(false);
    }
  };

  const cycleFoodSort = () => {
    const cycleMap: Record<
      string,
      {
        sortBy: 'orderIndex' | 'name' | 'protein' | 'calories' | 'carbs' | 'fat';
        sortOrder: 'asc' | 'desc';
      }
    > = {
      orderIndex: { sortBy: 'name', sortOrder: 'asc' },
      name: { sortBy: 'protein', sortOrder: 'desc' },
      protein: { sortBy: 'calories', sortOrder: 'desc' },
      calories: { sortBy: 'carbs', sortOrder: 'desc' },
      carbs: { sortBy: 'fat', sortOrder: 'desc' },
      fat: { sortBy: 'orderIndex', sortOrder: 'asc' },
    };

    const next = cycleMap[foodSortBy] || { sortBy: 'orderIndex', sortOrder: 'asc' };
    setFoodSortBy(next.sortBy);
    setFoodSortOrder(next.sortOrder);
  };

  const getFoodCategoryTheme = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'PROTEIN':
        return {
          pill: 'bg-red-950/80 border-red-800 text-red-300',
          badge: 'bg-red-950 text-red-300 border-red-800/80',
          dot: 'bg-red-400',
        };
      case 'CARBS':
        return {
          pill: 'bg-amber-950/80 border-amber-800 text-amber-300',
          badge: 'bg-amber-950 text-amber-300 border-amber-800/80',
          dot: 'bg-amber-400',
        };
      case 'FATS':
        return {
          pill: 'bg-blue-950/80 border-blue-800 text-blue-300',
          badge: 'bg-blue-950 text-blue-300 border-blue-800/80',
          dot: 'bg-blue-400',
        };
      case 'SUPERFOODS':
        return {
          pill: 'bg-emerald-950/80 border-emerald-700 text-emerald-300',
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-800/80',
          dot: 'bg-emerald-400',
        };
      default:
        return {
          pill: 'bg-zinc-900 border-zinc-800 text-zinc-300',
          badge: 'bg-zinc-900 text-zinc-300 border-zinc-800',
          dot: 'bg-zinc-400',
        };
    }
  };

  const totalExCount = exerciseCategories.reduce((acc, c) => acc + c.count, 0);
  const totalFoodCount = foodCategories.reduce((acc, c) => acc + c.count, 0);

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-500">Loading master library...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-3.5 sm:p-8 max-w-4xl mx-auto w-full space-y-4 sm:space-y-5 pb-32 sm:pb-20">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Master Library
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Browse and manage movements, muscle groups, and food nutrition database.
          </p>
        </div>
      </div>

      {/* 2-Tab Navigation (Exercises vs Foods) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('EXERCISES')}
          className={`py-2 text-xs font-mono font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'EXERCISES'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Dumbbell className="h-3.5 w-3.5 shrink-0" />
          <span>Exercises ({totalExCount || exercises.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FOODS')}
          className={`py-2 text-xs font-mono font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'FOODS'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Apple className="h-3.5 w-3.5 shrink-0" />
          <span>Foods ({totalFoodCount || foods.length})</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: EXERCISE LIBRARY */}
      {/* ===================================================================== */}
      {activeTab === 'EXERCISES' && (
        <div className="space-y-4">
          {/* Compact Search & Filter Toolbar */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <Input
                  type="search"
                  inputMode="search"
                  autoCorrect="off"
                  autoCapitalize="none"
                  enterKeyHint="search"
                  placeholder="Search exercises..."
                  value={exSearchQuery}
                  onChange={e => setExSearchQuery(e.target.value)}
                  className="pl-9 pr-7 h-9 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs"
                />
                {exSearchQuery && (
                  <button
                    onClick={() => setExSearchQuery('')}
                    className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Minimal Single-Click Sort Toggle */}
              <button
                type="button"
                onClick={cycleExSort}
                className="h-9 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors select-none"
                title="Click to cycle sort (Default → Name → Category)"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
                <span className="hidden sm:inline text-zinc-400 text-[11px]">Sort:</span>
                <span className="text-zinc-200">
                  {exSortBy === 'orderIndex' ? 'Default' : exSortBy === 'name' ? 'A-Z' : 'Category'}
                </span>
              </button>
            </div>

            {/* Horizontal Category Scroll Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedExCategory('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-medium border shrink-0 transition-colors ${
                  selectedExCategory === 'ALL'
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({totalExCount})
              </button>
              {exerciseCategories.map(cat => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedExCategory(cat.category)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium border shrink-0 transition-colors ${
                    selectedExCategory === cat.category
                      ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat.category} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Master List */}
          <div className="space-y-2">
            {loadingExercises ? (
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
                    {exSearchQuery || selectedExCategory !== 'ALL'
                      ? 'Try clearing or modifying your filter criteria.'
                      : 'Get started by creating your first exercise.'}
                  </p>
                </div>
                {(exSearchQuery || selectedExCategory !== 'ALL') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExSearchQuery('');
                      setSelectedExCategory('ALL');
                    }}
                    className="border-zinc-800 bg-zinc-900 text-zinc-300 text-xs h-8"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              exercises.map(exercise => {
                const isExpanded = expandedExId === exercise.id;

                return (
                  <div
                    key={exercise.id}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'bg-zinc-900 border-zinc-700'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-750'
                    }`}
                  >
                    {/* Main Card Header Row */}
                    <div
                      onClick={() =>
                        setExpandedExId(prev => (prev === exercise.id ? null : exercise.id))
                      }
                      className="flex items-center justify-between gap-3 p-3.5 sm:p-4 cursor-pointer select-none"
                    >
                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-zinc-100 truncate">
                            {exercise.name}
                          </h3>
                          <Badge className="bg-zinc-950 text-emerald-400 border-zinc-800 text-[10px] font-medium uppercase px-2 py-0">
                            {exercise.category}
                          </Badge>
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

                      {/* Actions */}
                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingExercise(exercise);
                            setExerciseDialogOpen(true);
                          }}
                          className="h-8 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg text-xs"
                          title="Edit Exercise"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteExerciseTarget(exercise)}
                          className="h-8 px-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg text-xs"
                          title="Delete Exercise"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                        <div
                          onClick={() =>
                            setExpandedExId(prev => (prev === exercise.id ? null : exercise.id))
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

                    {/* Drawer */}
                    {isExpanded && (
                      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-3 border-t border-zinc-800/80 bg-zinc-950/60 space-y-3 animate-in fade-in-50 duration-150">
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
                        ) : null}

                        {exercise.description && (
                          <div className="text-xs text-zinc-400 px-1">
                            <span className="text-zinc-500 font-medium">
                              Equipment / Overview:{' '}
                            </span>
                            <span>{exercise.description}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80">
                            <span className="text-[10px] text-zinc-500 block">Default Sets</span>
                            <span className="text-xs font-semibold text-zinc-200 font-mono">
                              {exercise.defaultSets ?? 3} Working Sets
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80">
                            <span className="text-[10px] text-zinc-500 block">
                              Target Rep Range
                            </span>
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
                        </div>

                        <ExerciseHistoryInline exerciseId={exercise.id} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: FOOD LIBRARY */}
      {/* ===================================================================== */}
      {activeTab === 'FOODS' && (
        <div className="space-y-4">
          {/* Search & Sort Toolbar - Single Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
              <Input
                type="search"
                inputMode="search"
                autoCorrect="off"
                autoCapitalize="none"
                enterKeyHint="search"
                placeholder="Search foods, macros, benefits, notes..."
                value={foodSearchQuery}
                onChange={e => setFoodSearchQuery(e.target.value)}
                className="pl-9 pr-7 h-9 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs"
              />
              {foodSearchQuery && (
                <button
                  onClick={() => setFoodSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={cycleFoodSort}
              className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors select-none ${
                foodSortBy !== 'orderIndex'
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
              }`}
              title="Click to cycle sort"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-zinc-400 text-[11px]">Sort:</span>
              <span className="font-semibold text-zinc-200">
                {foodSortBy === 'orderIndex'
                  ? 'Default'
                  : foodSortBy === 'name'
                    ? 'A-Z'
                    : foodSortBy === 'protein'
                      ? 'Protein'
                      : foodSortBy === 'calories'
                        ? 'Calories'
                        : foodSortBy === 'carbs'
                          ? 'Carbs'
                          : 'Fats'}
              </span>
            </button>
          </div>

          {/* Category Pills Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedFoodCategory('ALL')}
              className={`h-8 px-3 rounded-xl border font-medium flex items-center gap-1.5 shrink-0 transition-all select-none ${
                selectedFoodCategory === 'ALL'
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300 shadow-sm'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <span>All Foods</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40">
                {totalFoodCount}
              </span>
            </button>

            {['PROTEIN', 'CARBS', 'FATS', 'SUPERFOODS'].map(cat => {
              const stats = foodCategories.find(c => c.category.toUpperCase() === cat);
              const isSelected = selectedFoodCategory === cat;
              const theme = getFoodCategoryTheme(cat);

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedFoodCategory(cat)}
                  className={`h-8 px-3 rounded-xl border font-medium flex items-center gap-1.5 shrink-0 transition-all select-none ${
                    isSelected
                      ? `${theme.pill} shadow-sm font-semibold`
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                  <span>{cat}</span>
                  {stats && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40">
                      {stats.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Foods Grid / Cards */}
          <div className="space-y-2">
            {loadingFoods ? (
              <div className="p-10 text-center space-y-3 bg-zinc-900/50 rounded-2xl border border-zinc-800/80">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                <p className="text-xs text-zinc-400">Loading food database...</p>
              </div>
            ) : foods.length === 0 ? (
              <div className="p-10 text-center space-y-3 bg-zinc-900/40 rounded-2xl border border-zinc-800/60">
                <Apple className="h-7 w-7 mx-auto text-zinc-600" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-300">No food items found</h3>
                  <p className="text-xs text-zinc-500">
                    {foodSearchQuery || selectedFoodCategory !== 'ALL'
                      ? 'Try adjusting your search query or category filter.'
                      : 'Get started by adding custom foods.'}
                  </p>
                </div>
              </div>
            ) : (
              foods.map(food => {
                const theme = getFoodCategoryTheme(food.category);
                const isExpanded = expandedFoodId === food.id;

                const protein = Number(food.protein) || 0;
                const carbs = Number(food.carbs) || 0;
                const fat = Number(food.fat) || 0;
                const totalMacros = protein + carbs + fat;

                const proteinPct = totalMacros > 0 ? Math.round((protein / totalMacros) * 100) : 0;
                const carbsPct = totalMacros > 0 ? Math.round((carbs / totalMacros) * 100) : 0;
                const fatPct = totalMacros > 0 ? Math.max(0, 100 - proteinPct - carbsPct) : 0;

                return (
                  <div
                    key={food.id}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'bg-zinc-900 border-zinc-700'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-750'
                    }`}
                  >
                    {/* Main Food Card Header Row */}
                    <div
                      onClick={() => setExpandedFoodId(prev => (prev === food.id ? null : food.id))}
                      className="flex items-center justify-between gap-3 p-3.5 sm:p-4 cursor-pointer select-none"
                    >
                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-zinc-100 truncate">
                            {food.name}
                          </h3>
                          <Badge
                            className={`${theme.badge} text-[10px] font-medium uppercase px-2 py-0`}
                          >
                            {food.category}
                          </Badge>
                        </div>

                        {/* Reduced Size & Comfortable Nutrition Strip */}
                        <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[9.5px] font-mono text-zinc-400 flex-wrap">
                          <span className="text-zinc-300 font-medium">
                            {food.servingSize || 100}
                            {food.servingUnit || 'g'}
                          </span>
                          <span className="text-zinc-700">•</span>
                          <span className="text-orange-400/90">{food.calories || 0} kcal</span>
                          <span className="text-zinc-700">•</span>
                          <span className="text-rose-400/90">{protein}g P</span>
                          <span className="text-zinc-700">•</span>
                          <span className="text-amber-400/90">{carbs}g C</span>
                          <span className="text-zinc-700">•</span>
                          <span className="text-yellow-400/90">{fat}g F</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFoodToEdit(food);
                            setCreateFoodModalOpen(true);
                          }}
                          className="h-8 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg text-xs"
                          title="Edit Food"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteFoodTarget(food)}
                          className="h-8 px-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg text-xs"
                          title="Delete Food"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                        <div
                          onClick={() =>
                            setExpandedFoodId(prev => (prev === food.id ? null : food.id))
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

                    {/* Inline Expandable Drawer (Like Exercise Details) */}
                    {isExpanded && (
                      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-3 border-t border-zinc-800/80 bg-zinc-950/60 space-y-3 animate-in fade-in-50 duration-150">
                        {/* Macronutrient Highlights (4-Grid) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-950/60 border border-orange-800/50 text-orange-400 shrink-0">
                              <Flame className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] text-zinc-500 font-mono uppercase block">
                                Calories
                              </span>
                              <span className="text-xs font-bold font-mono text-zinc-100">
                                {food.calories || 0} kcal
                              </span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-950/60 border border-rose-800/50 text-rose-400 shrink-0">
                              <span className="text-xs font-bold font-mono">P</span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] text-zinc-500 font-mono uppercase block">
                                Protein
                              </span>
                              <span className="text-xs font-bold font-mono text-rose-300">
                                {protein} g
                              </span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-950/60 border border-amber-800/50 text-amber-400 shrink-0">
                              <span className="text-xs font-bold font-mono">C</span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] text-zinc-500 font-mono uppercase block">
                                Carbs
                              </span>
                              <span className="text-xs font-bold font-mono text-amber-300">
                                {carbs} g
                              </span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-yellow-950/60 border border-yellow-800/50 text-yellow-400 shrink-0">
                              <span className="text-xs font-bold font-mono">F</span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] text-zinc-500 font-mono uppercase block">
                                Fats
                              </span>
                              <span className="text-xs font-bold font-mono text-yellow-300">
                                {fat} g
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Macro Ratio Strip */}
                        {totalMacros > 0 && (
                          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                              <span>Macro Ratio</span>
                              <div className="flex items-center gap-2">
                                <span className="text-rose-400">{proteinPct}% P</span>
                                <span className="text-amber-400">{carbsPct}% C</span>
                                <span className="text-yellow-400">{fatPct}% F</span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden bg-zinc-950 flex">
                              <div
                                style={{ width: `${proteinPct}%` }}
                                className="bg-rose-500 h-full"
                              />
                              <div
                                style={{ width: `${carbsPct}%` }}
                                className="bg-amber-500 h-full"
                              />
                              <div
                                style={{ width: `${fatPct}%` }}
                                className="bg-yellow-500 h-full"
                              />
                            </div>
                          </div>
                        )}

                        {/* Benefits / Micronutrient Highlights */}
                        {food.benefits ? (
                          <div className="space-y-1 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                              <Sparkles className="h-3.5 w-3.5 shrink-0" />
                              <span>Key Benefits &amp; Micronutrients</span>
                            </div>
                            <p className="text-zinc-300 text-[11px] leading-relaxed pl-5">
                              {food.benefits}
                            </p>
                          </div>
                        ) : null}

                        {/* Usage & Notes */}
                        {food.notes && (
                          <div className="space-y-1 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-semibold">
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                              <span>Preparation &amp; Usage Notes</span>
                            </div>
                            <p className="text-zinc-400 text-[11px] leading-relaxed pl-5">
                              {food.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* DIALOGS & MODALS */}
      {/* --------------------------------------------------------------------- */}

      {/* Exercise Create / Edit Dialog */}
      <ExerciseDialog
        isOpen={exerciseDialogOpen}
        onClose={() => {
          setExerciseDialogOpen(false);
          setEditingExercise(null);
        }}
        onSave={handleCreateOrUpdateExercise}
        exerciseToEdit={editingExercise}
        existingCategories={exerciseCategories.map(c => c.category)}
      />

      {/* Food Create / Edit Modal */}
      <CreateFoodModal
        isOpen={createFoodModalOpen}
        onClose={() => {
          setCreateFoodModalOpen(false);
          setFoodToEdit(null);
        }}
        onSave={handleSaveFood}
        foodToEdit={foodToEdit}
      />

      {/* Delete Exercise Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteExerciseTarget}
        title="Delete Exercise"
        description={
          deleteExerciseTarget ? (
            <div className="space-y-2">
              <p>
                Are you sure you want to delete{' '}
                <strong className="text-zinc-100 font-semibold">
                  &quot;{deleteExerciseTarget.name}&quot;
                </strong>{' '}
                ({deleteExerciseTarget.category})?
              </p>
              <p className="text-[11px] text-zinc-400">
                If linked to historical workout logs, it will be safely deactivated to preserve
                data.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Delete Exercise"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeletingExercise}
        onConfirm={executeDeleteExercise}
        onClose={() => {
          if (!isDeletingExercise) setDeleteExerciseTarget(null);
        }}
      />

      {/* Delete Food Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteFoodTarget}
        title="Delete Food Item"
        description={
          deleteFoodTarget ? (
            <p>
              Are you sure you want to delete{' '}
              <strong className="text-zinc-100 font-semibold">
                &quot;{deleteFoodTarget.name}&quot;
              </strong>{' '}
              from the master food library?
            </p>
          ) : null
        }
        confirmLabel="Delete Food"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeletingFood}
        onConfirm={executeDeleteFood}
        onClose={() => {
          if (!isDeletingFood) setDeleteFoodTarget(null);
        }}
      />

      {/* Floating Action Button (FAB) at Bottom Right */}
      <button
        type="button"
        onClick={() => {
          if (activeTab === 'EXERCISES') {
            setEditingExercise(null);
            setExerciseDialogOpen(true);
          } else {
            setFoodToEdit(null);
            setCreateFoodModalOpen(true);
          }
        }}
        aria-label={activeTab === 'EXERCISES' ? 'Add new exercise' : 'Add new food item'}
        className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 z-40 h-13 w-13 rounded-full bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 flex items-center justify-center transition-transform active:scale-95 touch-manipulation cursor-pointer shadow-none"
        title={activeTab === 'EXERCISES' ? 'Add Exercise' : 'Add Food'}
      >
        <Plus className="h-6 w-6" />
      </button>
    </main>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 min-h-[calc(100dvh-4rem)] flex items-center justify-center p-8 bg-zinc-950">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 rounded-full text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-500 font-mono">Loading library...</p>
          </div>
        </div>
      }
    >
      <LibraryPageContent />
    </Suspense>
  );
}
